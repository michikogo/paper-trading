"use client"

import React from "react"

const LocalTime = ({ iso }: { iso: string }) => {
  return (
    <>
      {new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </>
  )
}

export default LocalTime
