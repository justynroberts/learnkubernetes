import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { ClusterFocus, ClusterStatus } from "../types";
import { FOCUS, LEGEND, REGION_TERMS, type Region } from "../lib/clusterFocus";
import { glossaryEntries } from "../lib/glossary";

/**
 * One fixed picture of a Kubernetes cluster, drawn once and reused by every
 * lesson. Each lesson names a `focus` region; that region lights up and the
 * rest recedes, so "where does this thing actually live?" is answered visually
 * before the learner runs a single command.
 *
 * Node 1 is drawn from live cluster data. Nodes 2 and 3 are ghosts — they show
 * what production looks like and make it obvious that a local Rancher Desktop
 * cluster has exactly one node, rather than quietly implying you have three.
 */

const GREEN = "#2fe070";
const BASE_STROKE = "#33482f";
const BASE_FILL = "#131b12";
const TEXT = "#94a3b8";
const TEXT_BRIGHT = "#e2e8f0";
const MONO = "var(--font-mono)";
/** App traffic is deliberately a different colour from the green control path:
    users reaching your app is a different thing from kubectl driving the API. */
const TRAFFIC = "#38bdf8";

interface Props {
  focus: ClusterFocus;
  status: ClusterStatus | null;
  /** Shows the clickable legend and lets the learner drive the highlight. */
  interactive?: boolean;
}

export function ClusterDiagram({ focus, status, interactive = false }: Props) {
  const [picked, setPicked] = useState<ClusterFocus | null>(null);
  const [hovered, setHovered] = useState<Region | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const effective = picked ?? focus;
  const { regions, caption } = FOCUS[effective] ?? FOCUS.all;
  // Hovering takes over the highlight entirely: light just that component and
  // push everything else back, so the description card has an obvious subject.
  const lit = useMemo(
    () => (hovered ? new Set<Region>([hovered]) : new Set(regions)),
    [regions, hovered],
  );
  const anyLit = lit.size > 0;
  const hoveredEntries = hovered ? glossaryEntries(REGION_TERMS[hovered] ?? []) : [];

  const nodes = status?.nodes ?? [];
  const localName = nodes[0]?.name ?? "your node";
  const realNodeCount = nodes.length;
  const namespace = status?.namespace ?? "k8s-academy";

  /** Visual state for a region: lit, normal, or pushed back behind the highlight. */
  function on(region: Region) {
    return lit.has(region);
  }
  function group(region: Region) {
    return {
      opacity: !anyLit ? 1 : on(region) ? 1 : 0.28,
      style: { transition: "opacity 350ms ease", cursor: interactive ? "help" : undefined },
      ...(interactive
        ? {
            onMouseEnter: () => setHovered(region),
            onMouseLeave: () => setHovered((h) => (h === region ? null : h)),
          }
        : {}),
    };
  }
  function stroke(region: Region) {
    return on(region) ? GREEN : BASE_STROKE;
  }
  function fill(region: Region) {
    return on(region) ? "#0e2416" : BASE_FILL;
  }
  function label(region: Region) {
    return on(region) ? "#d1fae5" : TEXT;
  }

  const podXs = [112, 207, 302];

  return (
    <div
      ref={wrapRef}
      className="relative rounded-xl border border-slate-700/60 p-4"
      style={{ background: "var(--color-panel)" }}
    >
      <svg
        viewBox="0 0 720 500"
        className="w-full"
        role="img"
        aria-label={`Diagram of a Kubernetes cluster. ${caption}`}
        onMouseMove={
          interactive
            ? (e) => {
                const box = wrapRef.current?.getBoundingClientRect();
                if (box) setPointer({ x: e.clientX - box.left, y: e.clientY - box.top });
              }
            : undefined
        }
        onMouseLeave={interactive ? () => setHovered(null) : undefined}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={GREEN} />
          </marker>
          <marker id="arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#3f5c3b" />
          </marker>
          <marker id="arrow-traffic" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={TRAFFIC} />
          </marker>
        </defs>

        {/* ---- cluster boundary ---- */}
        <rect x="92" y="6" width="622" height="446" rx="14" fill="#0c120b" stroke="#2a3d27" strokeWidth="1.5" />
        <text x="104" y="24" fontSize="9.5" fill="#5f7a5b" letterSpacing="1.6">
          CLUSTER · {status?.context ?? "rancher-desktop"}
        </text>

        {/* ---- you / kubectl ---- */}
        <g {...group("kubectl")}>
          <rect x="8" y="200" width="76" height="48" rx="8" fill={fill("kubectl")} stroke={stroke("kubectl")} />
          <text x="46" y="221" fontSize="11" fontFamily={MONO} fill={label("kubectl")} textAnchor="middle">
            kubectl
          </text>
          <text x="46" y="236" fontSize="8.5" fill="#5f7a5b" textAnchor="middle">
            you
          </text>
          <path
            d="M84,212 C 94,196 92,120 102,80"
            fill="none"
            stroke={on("kubectl") ? GREEN : "#3f5c3b"}
            strokeWidth="1.4"
            strokeDasharray="4 3"
            markerEnd={on("kubectl") ? "url(#arrow)" : "url(#arrow-dim)"}
          />
        </g>

        {/* ---- control plane ---- */}
        <g {...group("control-plane")}>
          <rect
            x="100"
            y="32"
            width="606"
            height="80"
            rx="10"
            fill={on("control-plane") ? "#0e2416" : "#101810"}
            stroke={stroke("control-plane")}
          />
          <text x="112" y="48" fontSize="9.5" fill={label("control-plane")} letterSpacing="1.4">
            CONTROL PLANE
          </text>
          {realNodeCount === 1 && (
            <text x="694" y="48" fontSize="8.5" fill="#5f7a5b" textAnchor="end">
              on k3s this runs on the same node as your workloads
            </text>
          )}
        </g>

        {(
          [
            { region: "api" as Region, x: 104, name: "API server", sub: "the front door" },
            { region: "scheduler" as Region, x: 256, name: "Scheduler", sub: "picks a node" },
            { region: "controllers" as Region, x: 408, name: "Controllers", sub: "Deployments, Jobs" },
            { region: "etcd" as Region, x: 560, name: "etcd", sub: "desired state" },
          ] as const
        ).map((chip) => (
          <g key={chip.region} {...group(chip.region)}>
            <rect
              x={chip.x}
              y="54"
              width="142"
              height="44"
              rx="7"
              fill={fill(chip.region)}
              stroke={stroke(chip.region)}
            />
            <text x={chip.x + 71} y="74" fontSize="11" fill={on(chip.region) ? "#eafff2" : TEXT_BRIGHT} textAnchor="middle">
              {chip.name}
            </text>
            <text x={chip.x + 71} y="88" fontSize="8.5" fill="#5f7a5b" textAnchor="middle">
              {chip.sub}
            </text>
          </g>
        ))}

        <path
          d="M300,112 L300,136"
          stroke="#3f5c3b"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          markerEnd="url(#arrow-dim)"
        />
        <text x="310" y="130" fontSize="8.5" fill="#5f7a5b">
          schedules &amp; reconciles onto nodes
        </text>

        {/* ---- local node ---- */}
        <g {...group("node-local")}>
          <rect
            x="100"
            y="140"
            width="300"
            height="300"
            rx="10"
            fill={on("node-local") ? "#0e2416" : "#101810"}
            stroke={stroke("node-local")}
          />
          <text x="112" y="160" fontSize="10" fontFamily={MONO} fill={on("node-local") ? "#eafff2" : TEXT_BRIGHT}>
            {localName}
          </text>
          <text x="112" y="172" fontSize="8.5" fill="#5f7a5b">
            {realNodeCount === 1 ? "your only node · control plane + worker" : "node 1"}
          </text>
        </g>

        <g {...group("kubelet")}>
          <rect x="110" y="176" width="88" height="20" rx="5" fill={fill("kubelet")} stroke={stroke("kubelet")} />
          <text x="154" y="190" fontSize="9.5" fontFamily={MONO} fill={label("kubelet")} textAnchor="middle">
            kubelet
          </text>
          <rect x="206" y="176" width="110" height="20" rx="5" fill={BASE_FILL} stroke={BASE_STROKE} />
          <text x="261" y="190" fontSize="9.5" fontFamily={MONO} fill={TEXT} textAnchor="middle">
            containerd
          </text>
        </g>

        {/* ---- ghost nodes: what production looks like ---- */}
        <g {...group("nodes-remote")} opacity={anyLit && !on("nodes-remote") ? 0.16 : 0.45}>
          {[
            { x: 410, w: 148, name: "node-2" },
            { x: 568, w: 138, name: "node-3" },
          ].map((n) => (
            <g key={n.name}>
              <rect
                x={n.x}
                y="140"
                width={n.w}
                height="300"
                rx="10"
                fill="#0d130c"
                stroke="#3a4d37"
                strokeDasharray="6 4"
              />
              <text x={n.x + 12} y="160" fontSize="10" fontFamily={MONO} fill="#7f9a7b">
                {n.name}
              </text>
              <text x={n.x + 12} y="172" fontSize="8.5" fill="#5f7a5b">
                not on your laptop
              </text>
              <rect
                x={n.x + (n.w - 86) / 2}
                y="214"
                width="86"
                height="136"
                rx="7"
                fill="#101810"
                stroke="#3a4d37"
                strokeDasharray="4 3"
              />
              <text x={n.x + n.w / 2} y="286" fontSize="9.5" fill="#5f7a5b" textAnchor="middle">
                Pod
              </text>
            </g>
          ))}
        </g>

        {/* Kept out of the ghost group above so it never fades — the whole
            point of drawing three nodes is that you only have one. */}
        <text x="558" y="412" fontSize="8.5" fill="#7f9a7b" textAnchor="middle">
          production spreads Pods across many nodes
        </text>
        <text x="558" y="426" fontSize="8.5" fill="#7f9a7b" textAnchor="middle">
          {realNodeCount === 1 ? "— your cluster has exactly one" : `— yours has ${realNodeCount}`}
        </text>

        {/* ---- namespace: logical, spans every node ---- */}
        <g {...group("namespace")}>
          <rect
            x="106"
            y="204"
            width="594"
            height="228"
            rx="10"
            fill="none"
            stroke={on("namespace") ? GREEN : "#3f5c3b"}
            strokeWidth={on("namespace") ? 1.8 : 1.2}
            strokeDasharray="7 5"
          />
          <rect x="112" y="196" width="196" height="16" rx="4" fill="#0c120b" />
          <text x="118" y="208" fontSize="9.5" fontFamily={MONO} fill={on("namespace") ? GREEN : "#7f9a7b"}>
            namespace: {namespace}
          </text>
          <rect x="592" y="196" width="112" height="16" rx="4" fill="#0c120b" />
          <text x="698" y="208" fontSize="8.5" fill="#5f7a5b" textAnchor="end">
            logical, not physical
          </text>
        </g>

        {/* ---- pods on the local node ---- */}
        <g {...group("pods")}>
          {podXs.map((px, i) => (
            <g key={px}>
              <rect x={px} y="214" width="86" height="136" rx="7" fill={fill("pods")} stroke={stroke("pods")} />
              <text x={px + 8} y="228" fontSize="9.5" fill={label("pods")}>
                Pod
              </text>
              <rect x={px + 7} y="256" width="72" height="34" rx="5" fill="#0b110a" stroke={on("pods") ? "#1e7a45" : "#2b3b29"} />
              <text x={px + 43} y="277" fontSize="9.5" fontFamily={MONO} fill={on("pods") ? "#9ef0bf" : TEXT} textAnchor="middle">
                nginx
              </text>
              {i > 0 && (
                <text x={px + 43} y="308" fontSize="8.5" fill="#5f7a5b" textAnchor="middle">
                  same Pod spec
                </text>
              )}
            </g>
          ))}
        </g>

        {/* ---- labels on those pods ---- */}
        <g {...group("labels")}>
          {podXs.map((px) => (
            <g key={px}>
              <rect x={px + 7} y="234" width="72" height="15" rx="4" fill={fill("labels")} stroke={stroke("labels")} />
              <text x={px + 43} y="245" fontSize="8.5" fontFamily={MONO} fill={label("labels")} textAnchor="middle">
                app=web
              </text>
            </g>
          ))}
        </g>

        {/* ---- config / secret / volume, mounted into the first Pod ---- */}
        {(
          [
            { region: "config" as Region, y: 296, text: "env: ConfigMap" },
            { region: "secret" as Region, y: 314, text: "env: Secret" },
            { region: "volume" as Region, y: 332, text: "vol: /cache" },
          ] as const
        ).map((chip) => (
          <g key={chip.region} {...group(chip.region)}>
            <rect
              x={podXs[0] + 7}
              y={chip.y}
              width="72"
              height="14"
              rx="4"
              fill={fill(chip.region)}
              stroke={stroke(chip.region)}
            />
            <text
              x={podXs[0] + 43}
              y={chip.y + 10}
              fontSize="8"
              fontFamily={MONO}
              fill={label(chip.region)}
              textAnchor="middle"
            >
              {chip.text}
            </text>
          </g>
        ))}

        {/* ---- probes: the kubelet checking the container ---- */}
        <g {...group("probes")}>
          <path
            d="M154,196 C 154,204 152,206 152,212"
            fill="none"
            stroke={on("probes") ? GREEN : "#3f5c3b"}
            strokeWidth="1.3"
            markerEnd={on("probes") ? "url(#arrow)" : "url(#arrow-dim)"}
          />
          <circle cx={podXs[0] + 78} cy="222" r="4" fill={on("probes") ? GREEN : "#2b3b29"} />
          {on("probes") && (
            <text x="322" y="190" fontSize="8.5" fill={GREEN}>
              liveness / readiness
            </text>
          )}
        </g>


        {/* ---- how users actually reach the application ---- */}
        <g {...group("ingress")}>
          <rect
            x="8"
            y="298"
            width="76"
            height="40"
            rx="8"
            fill={on("ingress") ? "#07202e" : BASE_FILL}
            stroke={on("ingress") ? TRAFFIC : BASE_STROKE}
          />
          <text x="46" y="317" fontSize="11" fill={on("ingress") ? "#bae6fd" : TEXT} textAnchor="middle">
            users
          </text>
          <text x="46" y="330" fontSize="8" fill="#5f7a5b" textAnchor="middle">
            of your app
          </text>

          <path
            d="M26,338 L26,352"
            stroke={on("ingress") ? TRAFFIC : "#3f5c3b"}
            strokeWidth="1.4"
            markerEnd={on("ingress") ? "url(#arrow-traffic)" : "url(#arrow-dim)"}
          />

          <rect
            x="8"
            y="356"
            width="76"
            height="40"
            rx="8"
            fill={on("ingress") ? "#07202e" : BASE_FILL}
            stroke={on("ingress") ? TRAFFIC : BASE_STROKE}
            strokeDasharray="5 3"
          />
          <text x="46" y="373" fontSize="9.5" fontFamily={MONO} fill={on("ingress") ? "#bae6fd" : TEXT} textAnchor="middle">
            Ingress
          </text>
          <text x="46" y="386" fontSize="7.5" fill="#5f7a5b" textAnchor="middle">
            in production
          </text>

          <path
            d="M84,376 C 96,376 98,379 108,379"
            fill="none"
            stroke={on("ingress") ? TRAFFIC : "#3f5c3b"}
            strokeWidth="1.4"
            markerEnd={on("ingress") ? "url(#arrow-traffic)" : "url(#arrow-dim)"}
          />
          <text x="36" y="350" fontSize="7.5" fill={on("ingress") ? TRAFFIC : "#5f7a5b"}>
            app traffic
          </text>
        </g>

        {/* ---- service: one virtual IP in front of every matching Pod ---- */}
        <g {...group("service")}>
          {[155, 250, 345, 484, 637].map((cx) => (
            <path
              key={cx}
              d={`M${cx},364 L${cx},350`}
              stroke={on("service") ? GREEN : "#3f5c3b"}
              strokeWidth="1.1"
              strokeDasharray="3 2"
            />
          ))}
          <rect
            x="112"
            y="364"
            width="582"
            height="30"
            rx="7"
            fill={fill("service")}
            stroke={stroke("service")}
          />
          <text x="122" y="378" fontSize="9.5" fontFamily={MONO} fill={label("service")}>
            Service web-svc
          </text>
          <text x="122" y="389" fontSize="8" fill={on("service") ? TRAFFIC : "#5f7a5b"}>
            where your application is reachable
          </text>
          <text x="684" y="383" fontSize="8.5" fill="#5f7a5b" textAnchor="end">
            stable ClusterIP + DNS · load-balances to every matching Pod, on any node
          </text>
        </g>

        {/* ---- batch work ---- */}
        <g {...group("job")}>
          <rect x="112" y="402" width="230" height="22" rx="5" fill={fill("job")} stroke={stroke("job")} strokeDasharray="4 3" />
          <text x="122" y="417" fontSize="8.5" fontFamily={MONO} fill={label("job")}>
            Job Pod · runs once → Completed
          </text>
        </g>

        {/* ---- outside the cluster ---- */}
        <g {...group("external")}>
          <path
            d="M400,452 L400,464"
            stroke={on("external") ? GREEN : "#3f5c3b"}
            strokeWidth="1.3"
            strokeDasharray="4 3"
            markerEnd={on("external") ? "url(#arrow)" : "url(#arrow-dim)"}
          />
          <rect
            x="100"
            y="466"
            width="606"
            height="28"
            rx="8"
            fill={on("external") ? "#0e2416" : "#0d130c"}
            stroke={on("external") ? GREEN : "#3a4d37"}
            strokeDasharray="6 4"
          />
          <text x="403" y="484" fontSize="9.5" fill={label("external")} textAnchor="middle">
            PagerDuty Runbook Automation (SaaS) — outside the cluster, reached by an outbound connection
          </text>
        </g>
      </svg>

      {/* Hover description. Content comes from the glossary, so the picture and
          the reference can't drift into two different explanations. */}
      <AnimatePresence>
        {hoveredEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-20 w-[300px] rounded-lg border border-pd-green/40 p-3 shadow-2xl"
            style={{
              background: "var(--color-panel-2)",
              left: Math.max(8, Math.min(pointer.x + 18, (wrapRef.current?.clientWidth ?? 720) - 308)),
              top: pointer.y + (pointer.y > (wrapRef.current?.clientHeight ?? 500) * 0.55 ? -14 : 18),
              transform:
                pointer.y > (wrapRef.current?.clientHeight ?? 500) * 0.55 ? "translateY(-100%)" : undefined,
            }}
          >
            {hoveredEntries.map((entry, idx) => (
              <div key={entry.term} className={idx > 0 ? "mt-2.5 border-t border-slate-700/50 pt-2.5" : undefined}>
                <div className="flex items-baseline justify-between gap-2">
                  <h5 className="text-sm font-semibold text-slate-100">{entry.term}</h5>
                  {entry.lesson !== undefined && (
                    <span className="shrink-0 text-[10px] text-slate-600">Lesson {entry.lesson}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-slate-300">{entry.what}</p>
                {idx === 0 && (
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{entry.detail}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex items-start gap-2 border-t border-slate-700/50 pt-3">
        <span className="mt-px shrink-0 text-[11px] font-semibold tracking-wide text-pd-green uppercase">
          You are here
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={hovered ?? effective}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-[13px] leading-snug text-slate-400"
          >
            {hovered ? `${hoveredEntries[0]?.term ?? ""} — ${hoveredEntries[0]?.what ?? ""}` : caption}
          </motion.span>
        </AnimatePresence>
      </div>

      {interactive && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LEGEND.map((item) => {
            const active = picked === item.focus;
            return (
              <button
                key={item.focus}
                onClick={() => setPicked(active ? null : item.focus)}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  active
                    ? "border-pd-green bg-pd-green/15 text-pd-green-light"
                    : "border-slate-700/70 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                )}
              >
                {item.label}
              </button>
            );
          })}
          {picked && (
            <button
              onClick={() => setPicked(null)}
              className="rounded-full px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-400"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
