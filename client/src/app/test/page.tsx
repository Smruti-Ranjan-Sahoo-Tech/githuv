
// 'use client'
// import React, { useEffect, useRef } from 'react'
// import { io, Socket } from 'socket.io-client'
// const page = () => {
//   const socketRef = useRef<Socket | null>(null)
//   socketRef.current = io('http://localhost:5002/')

//   useEffect(()=>{
//        socketRef.on("connect",()=>{
//         console.log("Connected ! ")
//        })
//   },[])

//   return (
//     <div>Test page</div>
//   )
// }

// export default page