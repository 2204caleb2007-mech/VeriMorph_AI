"use client"
import { useEffect } from "react";

import initPlanet3D from "@/components/3D/planet"

export default function Home() {

  useEffect(() => {
    const {scene, renderer} = initPlanet3D()
    
    return () => {
      if (renderer) {
        const gl = renderer.getContext();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer.dispose()
      }
    }
  }, [])
  
  return (
    <div className="page">
      <section className="hero_main">
        <div className="content">
          <h1>VeriMorph AI Forensics</h1>

          <p>
            Advanced document verification and forgery detection powered by specialized AI. Validate, secure, and streamline your compliance workflows instantly.
          </p>

          <button className="cta_btn" onClick={() => window.location.href = '/verimorph/index.html'}>Get started.</button>

        </div>
        <canvas className="planet-3D" />
      </section>
    </div>
  );
}
