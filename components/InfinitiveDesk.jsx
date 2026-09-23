"use client";

import { useEffect } from "react";
import { CSS } from "./desk.css.js";
import { MARKUP } from "./deskMarkup.js";
import { initDesk } from "./deskEngine.js";

export default function InfinitiveDesk() {
  useEffect(() => initDesk(), []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
