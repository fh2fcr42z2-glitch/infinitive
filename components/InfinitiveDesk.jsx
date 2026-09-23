"use client";

import { useEffect } from "react";
import "../style.css";
import { MARKUP } from "./deskMarkup.js";
import { initDesk } from "./deskEngine.js";

export default function InfinitiveDesk() {
  useEffect(() => initDesk(), []);
  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
