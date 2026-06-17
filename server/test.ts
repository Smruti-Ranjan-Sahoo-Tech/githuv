// import { resumeGraph } from "./src/lib/Langgraph/ResumeBuilder/Graph";

// const result = await resumeGraph.invoke({
//   userId: "dLxoZmaEswOxmqA5EByZ0rMlg1x2",
//   threadId: crypto.randomUUID(),
//   themeNo: "theme_1",
//   pageNo: "1",
// });




import fs from "fs/promises";


const latexCode=String.raw`
\documentclass[a4paper,10pt]{article}

\usepackage[left=0.7in,right=0.7in,top=0.5in,bottom=0.5in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}

\pagestyle{empty}
\setlength{\parindent}{0pt}

\newcommand{\sectionline}[1]{
    \vspace{4pt}
    \section*{#1}
    \vspace{-10pt}
    \hrule
    \vspace{6pt}
}

\begin{document}

\begin{center}
{\LARGE\textbf{John Doe}}

Bhubaneswar, Odisha, India | john.doe@gmail.com | +91 9876543210

LinkedIn: \href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe} |
GitHub: \href{https://github.com/johndoe}{github.com/johndoe} |
Portfolio: \href{https://johndoe.dev}{johndoe.dev}
\end{center}

\sectionline{Professional Summary}

Passionate MERN Stack Developer with experience building scalable web applications using React, Node.js, Express, MongoDB, and TypeScript.

\sectionline{Skills}

\textbf{Frontend:} HTML, CSS, JavaScript, React, Redux, Next.js, Tailwind CSS\\
\textbf{Backend:} Node.js, Express.js, REST API, JWT Authentication\\
\textbf{Database:} MongoDB, Mongoose\\
\textbf{Tools:} Git, GitHub, Postman, VS Code

\sectionline{Experience}

\textbf{TechNova Solutions} \hfill \textit{Frontend Developer Intern} \\
\textit{2025-01 - 2025-04} \\
Developed reusable React components and integrated REST APIs.

\sectionline{Education}

\textbf{Institute of Management and Information Technology}, Cuttack, Odisha \\
Master of Computer Applications \hfill \textit{2025-08 - 2027-05} \\
CGPA: 8.5 \\

\textbf{Udayanath Autonomous College}, Cuttack, Odisha \\
Bachelor of Science in Information Technology Management \hfill \textit{2022-07 - 2025-05} \\
CGPA: 7.4

\sectionline{Projects}

\textbf{iSmarty URL} \\
A URL shortening platform with analytics, custom short links, and authentication. \\
Technologies: React, Node.js, MongoDB, Express \\
\href{https://github.com/johndoe/ismarty-url}{GitHub} | \href{https://ismarty-url.vercel.app}{Live} \\

\textbf{ESOP E-Commerce} \\
Full-stack e-commerce platform with cart, checkout, authentication, and admin dashboard. \\
Technologies: React, Redux, Node.js, MongoDB \\
\href{https://github.com/johndoe/esop}{GitHub}

\sectionline{Certifications}

React Developer Certification - Meta \\
Node.js Essential Training - LinkedIn Learning

\sectionline{Additional Information}

\textbf{Languages:} English, Hindi, Odia \\
\textbf{Interests:} Web Development, Open Source, Artificial Intelligence

\end{document}
`




const response = await fetch(
  "http://localhost:3005/compile",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latex: latexCode,
    }),
  }
);

if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

const pdfBuffer = Buffer.from(
  await response.arrayBuffer()
);

await fs.writeFile(
  "./resume.pdf",
  pdfBuffer
);

console.log("PDF Saved");