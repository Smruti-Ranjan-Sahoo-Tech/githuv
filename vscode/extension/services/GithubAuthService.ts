import { env, Uri } from "vscode"

const GITHUB_SCOPES = ["read:user", "user:email", "repo"]
const GITHUB_CLIENT_ID = "01ab8ac9400c4e429b23"
const DEVICE_CODE_URL = "https://github.com/login/device/code"
const DEVICE_TOKEN_URL = "https://github.com/login/oauth/access_token"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type DeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval?: number
  error?: string
  error_description?: string
}

type TokenResponse = {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

export class GithubAuthService {
  async authenticate(onProgress?: (progress: { message: string; userCode?: string; verificationUri?: string }) => void): Promise<{ accessToken: string }> {
    const deviceCode = await this.createDeviceCode()

    onProgress?.({
      message: "Opening GitHub in your browser...",
      userCode: deviceCode.user_code,
      verificationUri: deviceCode.verification_uri_complete ?? deviceCode.verification_uri,
    })

    const verificationUrl = deviceCode.verification_uri_complete ?? deviceCode.verification_uri

    await env.openExternal(Uri.parse(verificationUrl))

    const accessToken = await this.pollForAccessToken(deviceCode)
    return { accessToken }
  }

  private async createDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch(DEVICE_CODE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: GITHUB_SCOPES.join(" "),
      }),
    })

    const text = await response.text()
    let payload: DeviceCodeResponse
    try {
      payload = JSON.parse(text) as DeviceCodeResponse
    } catch {
      throw new Error(text || `Failed to start GitHub sign-in (status ${response.status}).`)
    }

    if (!response.ok) {
      throw new Error(payload.error_description ?? payload.error ?? "Failed to start GitHub sign-in.")
    }

    if (!payload.device_code || !payload.user_code || !payload.verification_uri) {
      throw new Error("GitHub did not return a device code.")
    }

    return payload
  }

  private async pollForAccessToken(deviceCode: DeviceCodeResponse): Promise<string> {
    const expiresAt = Date.now() + deviceCode.expires_in * 1000
    let intervalMs = Math.max(5000, (deviceCode.interval ?? 5) * 1000)

    while (Date.now() < expiresAt) {
      const response = await fetch(DEVICE_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GITHUB_CLIENT_ID,
          device_code: deviceCode.device_code,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      })

      const text = await response.text()
      let payload: TokenResponse
      try {
        payload = JSON.parse(text) as TokenResponse
      } catch {
        throw new Error(text || `Token request failed (status ${response.status}).`)
      }

      if (response.ok && payload.access_token) {
        return payload.access_token
      }

      switch (payload.error) {
        case "authorization_pending":
          await sleep(intervalMs)
          continue
        case "slow_down":
          intervalMs += 5000
          await sleep(intervalMs)
          continue
        case "access_denied":
          throw new Error("GitHub sign-in was canceled or denied.")
        case "expired_token":
          throw new Error("GitHub sign-in timed out. Please try again.")
        default:
          throw new Error(
            payload.error_description ??
              payload.error ??
              "GitHub sign-in failed.",
          )
      }
    }

    throw new Error("Timed out waiting for GitHub sign-in to complete.")
  }
}
