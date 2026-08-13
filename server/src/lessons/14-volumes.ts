import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

const PATCH = JSON.stringify({
  spec: {
    template: {
      spec: {
        volumes: [{ name: "cache-volume", emptyDir: {} }],
        containers: [{ name: "nginx", volumeMounts: [{ name: "cache-volume", mountPath: "/cache" }] }],
      },
    },
  },
});

export const volumes: Lesson = {
  id: "volumes",
  order: 14,
  title: "Volumes",
  concept: "Volumes",
  focus: "volume",
  intro: `
Container filesystems are ephemeral by default — restart the container and its disk
is wiped. A **Volume** gives a Pod storage that outlives individual container
restarts (though an \`emptyDir\` volume, the simplest kind, is still deleted when the
whole Pod is removed — persisting data across Pod deletion needs a PersistentVolume,
a topic beyond this course). Volumes are defined at the Pod level and mounted into
one or more containers.
`,
  steps: [
    {
      kind: "task",
      id: "add-volume",
      title: "Mount an emptyDir volume",
      instructions: `Patch the \`web\` Deployment to add an \`emptyDir\` volume named \`cache-volume\`,
mounted at \`/cache\` in the container.`,
      command: `kubectl patch deployment web -n ${NAMESPACE} --type=strategic -p '${PATCH}'`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const podSpec = dep?.spec?.template?.spec;
        const vol = (podSpec?.volumes ?? []).find((v: any) => v.name === "cache-volume");
        if (!vol) return { pass: false, message: `No "cache-volume" volume found on the web Deployment yet.` };
        const mount = (podSpec?.containers?.[0]?.volumeMounts ?? []).find((m: any) => m.name === "cache-volume");
        if (!mount) return { pass: false, message: `"cache-volume" exists but isn't mounted into the container yet.` };
        return { pass: true, message: `cache-volume is mounted at ${mount.mountPath}.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-volumes",
      title: "Quick check",
      instructions: "What happens to an emptyDir volume's data when the Pod that owns it is deleted?",
      options: [
        "It's automatically backed up somewhere",
        "It's deleted along with the Pod",
        "It moves to the next Pod that gets scheduled",
        "It becomes a PersistentVolume automatically",
      ],
      correctIndex: 1,
      explanation:
        "emptyDir survives container restarts within the same Pod, but not Pod deletion — for data that needs to outlive the Pod, you need a PersistentVolume.",
    },
  ],
};
