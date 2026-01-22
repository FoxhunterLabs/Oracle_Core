import React, { useEffect, useMemo, useRef, useState } from "react";
import { SphereGeometry, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, PerspectiveCamera, Scene, WebGLRenderer, AdditiveBlending, Color, Vector3 } from "three";
import base44 from "../api/base44Client.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatPct(n) {
  const v = clamp(n ?? 0, 0, 1) * 100;
  return `${v.toFixed(0)}%`;
}

function signalColor(signal) {
  switch (String(signal || "").toUpperCase()) {
    case "GREEN":
      return "text-emerald-300";
    case "AMBER":
    case "YELLOW":
      return "text-amber-300";
    case "RED":
      return "text-red-300";
    default:
      return "text-slate-200";
  }
}

function ringColor(signal) {
  switch (String(signal || "").toUpperCase()) {
    case "GREEN":
      return "#34d399";
    case "AMBER":
    case "YELLOW":
      return "#fbbf24";
    case "RED":
      return "#fb7185";
    default:
      return "#e2e8f0";
  }
}

export default function OracleCore() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const pointsRef = useRef(null);
  const rafRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const derived = useMemo(() => {
    const conf = prediction?.confidence ?? 0;
    const sig = prediction?.signal ?? "UNKNOWN";
    const narrative = prediction?.narrative ?? "Awaiting signal...";
    const ts = prediction?.timestamp ? new Date(prediction.timestamp) : null;
    const vectors = Array.isArray(prediction?.vectors) ? prediction.vectors : [];
    return { conf, sig, narrative, ts, vectors };
  }, [prediction]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await base44.integrations.Core.predict();
        if (!cancelled) setPrediction(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const interval = setInterval(() => {
      load();
    }, 7000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new Scene();
    scene.background = new Color("#000000");

    const camera = new PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    mount.appendChild(renderer.domElement);

    // Starfield / particle globe
    const geo = new BufferGeometry();
    const count = 2200;

    const positions = [];
    const colors = [];
    const base = new Color("#60a5fa");
    const alt = new Color("#a78bfa");

    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const mix = Math.random();
      const c = base.clone().lerp(alt, mix);
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));

    const mat = new PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const points = new Points(geo, mat);
    scene.add(points);

    // Orbiting "probe" points (vectors)
    const probeGeo = new BufferGeometry();
    const probePositions = new Float32Array(derived.vectors.length * 3);
    probeGeo.setAttribute("position", new Float32BufferAttribute(probePositions, 3));

    const probeMat = new PointsMaterial({
      size: 0.18,
      color: ringColor(derived.sig),
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const probes = new Points(probeGeo, probeMat);
    scene.add(probes);

    // Refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    pointsRef.current = { points, probes, probeGeo, probeMat };

    const center = new Vector3(0, 0, 0);

    function updateProbes(vectors) {
      const { probeGeo } = pointsRef.current || {};
      if (!probeGeo) return;

      const arr = probeGeo.attributes.position.array;
      const n = vectors.length;

      for (let i = 0; i < n; i++) {
        const v = vectors[i];
        const mag = clamp(v?.magnitude ?? 0.4, 0, 1);
        const az = ((v?.azimuth ?? 0) * Math.PI) / 180;
        const el = ((v?.elevation ?? 0) * Math.PI) / 180;

        const radius = 10 + mag * 6;
        const x = radius * Math.cos(el) * Math.cos(az);
        const y = radius * Math.sin(el);
        const z = radius * Math.cos(el) * Math.sin(az);

        arr[i * 3 + 0] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
      }

      probeGeo.setDrawRange(0, n);
      probeGeo.attributes.position.needsUpdate = true;
    }

    let t = 0;

    function animate() {
      t += 0.0035;

      if (points) {
        points.rotation.y += 0.0018;
        points.rotation.x = Math.sin(t) * 0.12;
      }

      const p = pointsRef.current;
      if (p?.probes) {
        p.probes.rotation.y -= 0.0022;
        p.probes.rotation.x = Math.cos(t * 0.9) * 0.08;

        // Keep probes aimed around center visually
        p.probes.lookAt(center);
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    }

    animate();

    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener("resize", onResize);

    // initial probe update
    updateProbes(derived.vectors);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement?.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update probe positions + color when prediction changes
  useEffect(() => {
    const p = pointsRef.current;
    if (!p) return;
    p.probeMat.color = new Color(ringColor(derived.sig));
    const arr = p.probeGeo?.attributes?.position?.array;
    if (!arr) return;

    const vectors = derived.vectors || [];
    const n = vectors.length;

    for (let i = 0; i < n; i++) {
      const v = vectors[i];
      const mag = clamp(v?.magnitude ?? 0.4, 0, 1);
      const az = ((v?.azimuth ?? 0) * Math.PI) / 180;
      const el = ((v?.elevation ?? 0) * Math.PI) / 180;

      const radius = 10 + mag * 6;
      const x = radius * Math.cos(el) * Math.cos(az);
      const y = radius * Math.sin(el);
      const z = radius * Math.cos(el) * Math.sin(az);

      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }

    p.probeGeo.setDrawRange(0, n);
    p.probeGeo.attributes.position.needsUpdate = true;
  }, [derived.sig, derived.vectors]);

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs tracking-[0.35em] text-slate-400">ORACLE CORE</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Deep-space inference console
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              A particle-driven visualization layer for “signal + confidence + narrative” style predictions.
              Mock data by default, API-capable if you wire it.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-xs text-slate-400">Signal</div>
                <div className={`mt-1 text-lg font-semibold ${signalColor(derived.sig)}`}>
                  {String(derived.sig).toUpperCase()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Confidence</div>
                <div className="mt-1 text-lg font-semibold text-slate-100">
                  {formatPct(derived.conf)}
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${clamp(derived.conf ?? 0, 0, 1) * 100}%`,
                  background: ringColor(derived.sig),
                  boxShadow: `0 0 20px ${ringColor(derived.sig)}`,
                }}
              />
            </div>

            <div className="mt-3 text-xs text-slate-400">
              {derived.ts ? (
                <>Last update: <span className="text-slate-200">{derived.ts.toLocaleString()}</span></>
              ) : (
                <>Last update: <span className="text-slate-200">—</span></>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0">
              <div ref={mountRef} className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-slate-200"
                  style={{
                    boxShadow: `0 0 18px rgba(59,130,246,0.14)`,
                  }}
                >
                  particle field
                </div>

                <div className="absolute bottom-6 left-6 text-xs text-slate-400">
                  vectors: <span className="text-slate-200">{derived.vectors.length}</span>
                </div>

                <div className="absolute bottom-6 right-6 text-xs text-slate-400">
                  refresh: <span className="text-slate-200">7s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs tracking-[0.3em] text-slate-400">NARRATIVE</div>

              {loading ? (
                <div className="mt-4 text-sm text-slate-300">Listening for signal…</div>
              ) : err ? (
                <div className="mt-4 text-sm text-red-300">
                  Error: <span className="text-red-200">{err}</span>
                </div>
              ) : (
                <div className="mt-4 text-sm leading-relaxed text-slate-200">
                  {derived.narrative}
                </div>
              )}

              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-xs tracking-[0.3em] text-slate-400">VECTOR FEED</div>
                <div className="mt-3 space-y-2">
                  {(derived.vectors || []).slice(0, 8).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                    >
                      <div className="text-xs text-slate-300">
                        #{v.id} · mag{" "}
                        <span className="text-slate-100">
                          {clamp(v.magnitude, 0, 1).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        az {Math.round(v.azimuth)}° · el {Math.round(v.elevation)}°
                      </div>
                    </div>
                  ))}
                  {derived.vectors.length === 0 ? (
                    <div className="text-xs text-slate-400">No vectors.</div>
                  ) : null}
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  Showing up to 8 vectors (of {derived.vectors.length}).
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-5">
              <div className="text-xs text-slate-400">Tip</div>
              <div className="mt-1 text-sm text-slate-200">
                Set <span className="font-mono text-xs text-slate-100">VITE_BASE44_API_URL</span> and return JSON
                from <span className="font-mono text-xs text-slate-100">/predict</span> to make it real.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
