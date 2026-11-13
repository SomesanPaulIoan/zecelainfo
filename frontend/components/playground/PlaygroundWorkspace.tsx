"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import JSZip from "jszip";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  Download,
  Files,
  FilePlus2,
  FileText,
  Folder,
  FolderGit2,
  FolderOpen,
  FolderPlus,
  Loader2,
  LogIn,
  Pencil,
  Play,
  Save,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { InteractiveTerminal, type InteractiveTerminalHandle, type TerminalStatus } from "@/components/playground/InteractiveTerminal";
import { useAuth } from "@/components/auth/AuthProvider";
import { useHideSiteFooter } from "@/components/layout/ChromeContext";
import { useMediaQuery } from "@/lib/useMediaQuery";
import {
  createPlaygroundProject,
  deletePlaygroundProject,
  listPlaygroundProjects,
  updatePlaygroundProject,
  type PlaygroundFile,
  type PlaygroundLanguage,
  type PlaygroundProject,
} from "@/lib/api";

const STARTER_CODE: Record<PlaygroundLanguage, string> = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Salut!";\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Salut!");\n    return 0;\n}\n',
  pascal: "program salut;\nbegin\n  writeln('Salut!');\nend.\n",
  python: 'print("Salut!")\n',
};

const LANGUAGE_BY_EXTENSION: Record<string, PlaygroundLanguage> = {
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  pas: "pascal",
  py: "python",
};

const LANGUAGE_LABEL: Record<PlaygroundLanguage, string> = {
  cpp: "C++",
  c: "C",
  pascal: "Pascal",
  python: "Python",
};

const LANGUAGE_ACCENT: Record<PlaygroundLanguage, string> = {
  cpp: "text-blue-400",
  c: "text-indigo-400",
  pascal: "text-orange-400",
  python: "text-yellow-300",
};

const STATUS_LABEL: Record<TerminalStatus, string> = {
  idle: "Pregatit",
  connecting: "Conectare...",
  running: "Ruleaza...",
  exited: "Terminat",
  compile_error: "Eroare de compilare",
  error: "Eroare",
  timeout: "Timp depasit",
};

const RESIZE_HANDLE_V = "relative w-1 shrink-0 cursor-col-resize bg-zinc-800 transition hover:bg-sky-500/60 active:bg-sky-400";
const RESIZE_HANDLE_H = "relative h-1 shrink-0 cursor-row-resize bg-zinc-800 transition hover:bg-sky-500/60 active:bg-sky-400";

type EditableFile = PlaygroundFile & { id: string };
type SidebarView = "explorer" | "projects";

type TreeFileNode = { type: "file"; path: string; file: EditableFile };
type TreeFolderNode = { type: "folder"; path: string; name: string; children: TreeNode[] };
type TreeNode = TreeFileNode | TreeFolderNode;

let localFileCounter = 0;
function nextFileId() {
  localFileCounter += 1;
  return `f${Date.now()}_${localFileCounter}`;
}

function withIds(files: PlaygroundFile[]): EditableFile[] {
  return files.map((f) => ({ ...f, id: nextFileId() }));
}

function stripIds(files: EditableFile[]): PlaygroundFile[] {
  return files.map(({ id: _id, ...rest }) => rest);
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function inferLanguage(name: string): PlaygroundLanguage | null {
  return LANGUAGE_BY_EXTENSION[extensionOf(name)] ?? null;
}

function editorLanguageFor(name: string): "cpp" | "c" | "pascal" | "python" | "plaintext" {
  return inferLanguage(name) ?? "plaintext";
}

function starterContentFor(name: string): string {
  const lang = inferLanguage(name);
  return lang ? STARTER_CODE[lang] : "";
}

/** Adevarat daca fisierul e inca exact continutul cu care a fost creat (gol sau un starter nemodificat) - semnul ca e sigur sa-i schimbam continutul cand i se schimba extensia la redenumire, fara sa stergem cod deja scris de utilizator. */
function isUnmodifiedStarter(content: string): boolean {
  return content === "" || Object.values(STARTER_CODE).includes(content);
}

function defaultFile(): EditableFile {
  const name = "solution.cpp";
  return { id: nextFileId(), name, content: starterContentFor(name) };
}

function buildTree(files: EditableFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.name.split("/").filter(Boolean);
    let level = root;
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      let folder = level.find((n) => n.type === "folder" && n.path === currentPath) as TreeFolderNode | undefined;
      if (!folder) {
        folder = { type: "folder", path: currentPath, name: parts[i], children: [] };
        level.push(folder);
      }
      level = folder.children;
    }
    level.push({ type: "file", path: file.name, file });
  }
  const sortLevel = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      const nameA = a.type === "folder" ? a.name : a.file.name;
      const nameB = b.type === "folder" ? b.name : b.file.name;
      return nameA.localeCompare(nameB);
    });
    for (const node of nodes) if (node.type === "folder") sortLevel(node.children);
  };
  sortLevel(root);
  return root;
}

export function PlaygroundWorkspace({ initialProject }: { initialProject?: PlaygroundProject }) {
  useHideSiteFooter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const initialFiles = initialProject && initialProject.files.length > 0 ? withIds(initialProject.files) : [defaultFile()];

  const [projectId, setProjectId] = useState<string | null>(initialProject?.id ?? null);
  const [projectName, setProjectName] = useState(initialProject?.name ?? "Proiect nou");
  const [files, setFiles] = useState<EditableFile[]>(initialFiles);
  const [openTabIds, setOpenTabIds] = useState<string[]>([initialFiles[0].id]);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFiles[0].id);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFolderPath, setRenamingFolderPath] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const [sidebarView, setSidebarView] = useState<SidebarView>("explorer");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>("idle");
  const [terminalDetail, setTerminalDetail] = useState<{ timeMs?: number; exitCode?: number }>({});
  const terminalRef = useRef<InteractiveTerminalHandle>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [projects, setProjects] = useState<PlaygroundProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const refreshProjects = async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setIsLoadingProjects(true);
    try {
      const list = await listPlaygroundProjects();
      setProjects(list);
    } catch {
      // liniste: lista de proiecte salvate nu e critica pentru rularea codului
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    void refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onRun = () => {
    terminalRef.current?.run();
  };

  const onFilesProduced = (produced: PlaygroundFile[]) => {
    if (produced.length === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      for (const file of produced) {
        const idx = next.findIndex((f) => f.name === file.name);
        if (idx >= 0) next[idx] = { ...next[idx], content: file.content };
        else next.push({ ...file, id: nextFileId() });
      }
      return next;
    });
  };

  const onSave = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name: projectName.trim() || "Proiect fara nume",
        files: stripIds(files),
        stdin: "",
        input_source: "stdin" as const,
        input_filename: null,
        output_target: "stdout" as const,
        output_filename: null,
      };
      const saved = projectId ? await updatePlaygroundProject(projectId, payload) : await createPlaygroundProject(payload);
      setProjectId(saved.id);
      setProjectName(saved.name);
      await refreshProjects();
      if (!initialProject || initialProject.id !== saved.id) {
        router.replace(`/compilator/${saved.id}`);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Salvarea a esuat");
    } finally {
      setIsSaving(false);
    }
  };

  const onNewProject = () => {
    const file = defaultFile();
    setProjectId(null);
    setProjectName("Proiect nou");
    setFiles([file]);
    setOpenTabIds([file.id]);
    setActiveFileId(file.id);
    setRenamingFileId(null);
    setRenamingFolderPath(null);
    router.replace("/compilator");
  };

  const onLoadProject = (project: PlaygroundProject) => {
    const loaded = project.files.length > 0 ? withIds(project.files) : [defaultFile()];
    setProjectId(project.id);
    setProjectName(project.name);
    setFiles(loaded);
    setOpenTabIds([loaded[0].id]);
    setActiveFileId(loaded[0].id);
    setRenamingFileId(null);
    setRenamingFolderPath(null);
    setSidebarView("explorer");
    router.replace(`/compilator/${project.id}`);
  };

  const onDeleteProject = async (id: string) => {
    try {
      await deletePlaygroundProject(id);
      if (projectId === id) onNewProject();
      await refreshProjects();
    } catch {
      // ignoram: userul poate incerca din nou din lista
    }
  };

  const onDownloadProject = async (project: PlaygroundProject) => {
    const zip = new JSZip();
    for (const file of project.files) {
      zip.file(file.name || "fisier.txt", file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const objectUrl = URL.createObjectURL(blob);
    const safeName = (project.name || "proiect").replace(/[\\/:*?"<>|]+/g, "_").trim() || "proiect";
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${safeName}.zip`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  const openTab = (id: string) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  };

  const closeTab = (id: string) => {
    setOpenTabIds((prev) => {
      const next = prev.filter((tabId) => tabId !== id);
      if (activeFileId === id) {
        setActiveFileId(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  };

  const onAddFile = () => {
    let index = files.length + 1;
    let name = `fisier${index}.cpp`;
    while (files.some((f) => f.name === name)) {
      index += 1;
      name = `fisier${index}.cpp`;
    }
    const file: EditableFile = { id: nextFileId(), name, content: starterContentFor(name) };
    setFiles((prev) => [...prev, file]);
    openTab(file.id);
    setRenamingFolderPath(null);
    setRenamingFileId(file.id);
  };

  const onAddFolder = () => {
    let index = 1;
    let folderName = `folder${index}`;
    while (files.some((f) => f.name === folderName || f.name.startsWith(`${folderName}/`))) {
      index += 1;
      folderName = `folder${index}`;
    }
    const fileName = `${folderName}/fisier1.cpp`;
    const file: EditableFile = { id: nextFileId(), name: fileName, content: starterContentFor(fileName) };
    setFiles((prev) => [...prev, file]);
    openTab(file.id);
    setRenamingFileId(null);
    setRenamingFolderPath(folderName);
  };

  const onRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    closeTab(id);
    if (renamingFileId === id) setRenamingFileId(null);
  };

  const onRemoveFolder = (path: string) => {
    const prefix = `${path}/`;
    const toRemove = files.filter((f) => f.name.startsWith(prefix));
    setFiles((prev) => prev.filter((f) => !f.name.startsWith(prefix)));
    for (const f of toRemove) closeTab(f.id);
    if (renamingFolderPath === path) setRenamingFolderPath(null);
  };

  const onCommitRename = (id: string, rawName: string) => {
    const name = rawName.trim();
    setRenamingFileId(null);
    if (!name) return;
    const collides = files.some((f) => f.id !== id && f.name === name);
    if (collides) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name, content: isUnmodifiedStarter(f.content) ? starterContentFor(name) : f.content } : f)),
    );
  };

  const onCommitFolderRename = (oldPath: string, rawName: string) => {
    const newName = rawName.trim();
    setRenamingFolderPath(null);
    if (!newName || newName === oldPath) return;
    const oldPrefix = `${oldPath}/`;
    const newPrefix = `${newName}/`;
    setFiles((prev) => prev.map((f) => (f.name.startsWith(oldPrefix) ? { ...f, name: newPrefix + f.name.slice(oldPrefix.length) } : f)));
    setCollapsedFolders((prev) => {
      if (!prev.has(oldPath)) return prev;
      const next = new Set(prev);
      next.delete(oldPath);
      next.add(newName);
      return next;
    });
  };

  const onEditFileContent = (id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) : undefined;
  const activeLanguage = activeFile ? inferLanguage(activeFile.name) : null;
  const fileTree = buildTree(files);

  // --- activity bar + sidebar ---

  const activityBar = (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-zinc-800 bg-zinc-950 py-2">
      <div className="flex flex-col items-center gap-1">
        <ActivityIcon
          icon={Files}
          label="Explorer"
          active={sidebarView === "explorer" && !sidebarCollapsed}
          onClick={() => {
            if (sidebarView === "explorer") setSidebarCollapsed((prev) => !prev);
            else {
              setSidebarView("explorer");
              setSidebarCollapsed(false);
            }
          }}
        />
        <ActivityIcon
          icon={FolderGit2}
          label="Proiectele mele"
          active={sidebarView === "projects" && !sidebarCollapsed}
          onClick={() => {
            if (sidebarView === "projects") setSidebarCollapsed((prev) => !prev);
            else {
              setSidebarView("projects");
              setSidebarCollapsed(false);
            }
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActivityIcon icon={Play} label="Ruleaza" active={false} accent onClick={onRun} />
      </div>
    </div>
  );

  const renderTreeNodes = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((node) => {
      if (node.type === "folder") {
        const collapsed = collapsedFolders.has(node.path);
        return (
          <div key={node.path}>
            <ExplorerFolderRow
              name={node.name}
              depth={depth}
              collapsed={collapsed}
              renaming={renamingFolderPath === node.path}
              onToggle={() => toggleFolder(node.path)}
              onStartRename={() => {
                setRenamingFileId(null);
                setRenamingFolderPath(node.path);
              }}
              onCommitRename={(name) => onCommitFolderRename(node.path, name)}
              onDelete={() => onRemoveFolder(node.path)}
            />
            {!collapsed ? renderTreeNodes(node.children, depth + 1) : null}
          </div>
        );
      }
      const lang = inferLanguage(node.file.name);
      const displayName = node.file.name.slice(node.file.name.lastIndexOf("/") + 1);
      return (
        <ExplorerRow
          key={node.file.id}
          icon={
            lang ? <Braces className={`h-3.5 w-3.5 ${LANGUAGE_ACCENT[lang]}`} /> : <FileText className="h-3.5 w-3.5 text-zinc-500" />
          }
          label={displayName}
          depth={depth}
          active={activeFileId === node.file.id}
          renaming={renamingFileId === node.file.id}
          onClick={() => openTab(node.file.id)}
          onStartRename={() => {
            setRenamingFolderPath(null);
            setRenamingFileId(node.file.id);
          }}
          onCommitRename={(name) => {
            const prefix = node.file.name.includes("/") ? `${node.file.name.slice(0, node.file.name.lastIndexOf("/"))}/` : "";
            onCommitRename(node.file.id, name.includes("/") ? name : `${prefix}${name}`);
          }}
          onDelete={() => onRemoveFile(node.file.id)}
        />
      );
    });

  const explorerContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-3">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{projectName || "Proiect nou"}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={onAddFile} className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Fisier nou">
            <FilePlus2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onAddFolder} className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Folder nou">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-0.5">{renderTreeNodes(fileTree, 0)}</div>
      </div>
    </div>
  );

  const projectsContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Proiectele mele</p>
        <button type="button" onClick={onNewProject} className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Proiect nou">
          <FilePlus2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {authLoading ? (
        <p className="px-4 py-6 text-center text-xs text-zinc-500">Se incarca...</p>
      ) : !user ? (
        <div className="mx-3 mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-6 text-center">
          <LogIn className="h-5 w-5 text-zinc-500" />
          <p className="text-xs font-medium text-zinc-400">Autentifica-te pentru a-ti salva proiectele</p>
          <Link href="/login" className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">
            Login
          </Link>
        </div>
      ) : isLoadingProjects ? (
        <p className="px-4 py-6 text-center text-xs text-zinc-500">Se incarca proiectele...</p>
      ) : projects.length === 0 ? (
        <p className="mx-3 mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-6 text-center text-xs text-zinc-500">
          Nu ai niciun proiect salvat inca.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          <div className="space-y-0.5">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center justify-between gap-1 rounded px-2 py-1.5 text-left text-xs transition ${
                  projectId === project.id ? "bg-sky-500/15 text-sky-200" : "text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                <button type="button" onClick={() => onLoadProject(project)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold">{project.name}</p>
                  <p className={`truncate text-[10px] ${projectId === project.id ? "text-sky-400/80" : "text-zinc-500"}`}>
                    {project.files.length} fisiere · {new Date(project.updated_at).toLocaleDateString("ro-RO")}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => void onDownloadProject(project)}
                    className="rounded p-1 text-zinc-500 hover:bg-sky-500/10 hover:text-sky-400"
                    title="Descarca arhiva zip"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteProject(project.id)}
                    className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Sterge proiectul"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-zinc-900">
      {sidebarView === "explorer" ? explorerContent : projectsContent}
    </div>
  );

  // --- editor tabs + monaco ---

  const editorTabs = (
    <div className="flex shrink-0 items-stretch overflow-x-auto border-b border-zinc-800 bg-zinc-900">
      {openTabIds.map((id) => {
        const file = files.find((f) => f.id === id);
        if (!file) return null;
        const lang = inferLanguage(file.name);
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveFileId(id)}
            className={`group flex shrink-0 items-center gap-1.5 border-r border-zinc-800 px-3 py-1.5 text-xs font-medium transition ${
              activeFileId === id ? "bg-[#1e1e1e] text-zinc-100" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
            }`}
          >
            {lang ? <Braces className={`h-3.5 w-3.5 ${LANGUAGE_ACCENT[lang]}`} /> : <FileText className="h-3.5 w-3.5 text-zinc-500" />}
            {file.name || "(fara nume)"}
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.stopPropagation();
                closeTab(id);
              }}
              className="ml-1 rounded p-0.5 text-zinc-600 opacity-0 transition hover:bg-zinc-700 hover:text-zinc-200 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );

  const editorArea = (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      {editorTabs}
      <div className="min-h-0 flex-1">
        {activeFile ? (
          <CodeEditor
            value={activeFile.content}
            onChange={(value) => onEditFileContent(activeFile.id, value)}
            language={editorLanguageFor(activeFile.name)}
            onRunShortcut={onRun}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Deschide un fisier din Explorer pentru a incepe</div>
        )}
      </div>
    </div>
  );

  // --- bottom panel: terminal interactiv real ---

  const bottomPanel = (
    <div className="flex h-full min-h-0 flex-col bg-zinc-900">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-zinc-300">
          <Terminal className="h-3.5 w-3.5" /> TERMINAL
        </div>
        <span className="text-[11px] text-zinc-500">
          {STATUS_LABEL[terminalStatus]}
          {terminalStatus === "exited" && terminalDetail.timeMs !== undefined ? ` · ${terminalDetail.timeMs} ms` : ""}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <InteractiveTerminal
          ref={terminalRef}
          language={activeLanguage}
          code={activeFile?.content ?? ""}
          files={stripIds(files.filter((f) => f.id !== activeFileId))}
          activeFileName={activeFile?.name ?? "(niciun fisier)"}
          onFilesProduced={onFilesProduced}
          onStatusChange={(status, detail) => {
            setTerminalStatus(status);
            if (detail) setTerminalDetail(detail);
          }}
        />
      </div>
    </div>
  );

  const editorAndPanel = isDesktop ? (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="62" minSize="30">
        {editorArea}
      </Panel>
      <Separator className={RESIZE_HANDLE_H} />
      <Panel defaultSize="38" minSize="15">
        {bottomPanel}
      </Panel>
    </Group>
  ) : (
    <div className="flex flex-col">
      <div className="h-[55vh]">{editorArea}</div>
      <div className="h-[45vh] border-t border-zinc-800">{bottomPanel}</div>
    </div>
  );

  const statusBar = (
    <div className="flex h-6 shrink-0 items-center justify-between bg-sky-700 px-2.5 text-[11px] font-medium text-white">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="flex items-center gap-1 truncate">
          {terminalStatus === "connecting" || terminalStatus === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                terminalStatus === "exited" && terminalDetail.exitCode === 0
                  ? "bg-emerald-300"
                  : terminalStatus === "idle"
                    ? "bg-zinc-300"
                    : "bg-rose-300"
              }`}
            />
          )}
          {STATUS_LABEL[terminalStatus]}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded bg-sky-600/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {activeLanguage ? LANGUAGE_LABEL[activeLanguage] : activeFile ? extensionOf(activeFile.name).toUpperCase() || "?" : "—"}
        </span>
        <span className="hidden md:inline">UTF-8</span>
        <span className="hidden font-semibold tracking-wide sm:inline">Zece la Info</span>
      </div>
    </div>
  );

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-zinc-950">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            Acasa
          </Link>
          <div className="h-4 w-px shrink-0 bg-zinc-800" />
          <Terminal className="h-4 w-4 shrink-0 text-sky-400" />
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="min-w-0 max-w-[16rem] truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm font-bold text-zinc-100 outline-none transition hover:border-zinc-800 focus:border-sky-500/50 focus:bg-zinc-800"
          />
        </div>
        <div className="flex items-center gap-2">
          {saveError ? <p className="text-xs font-medium text-rose-400">{saveError}</p> : null}
          <button
            type="button"
            onClick={onRun}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:from-emerald-400 hover:to-emerald-500"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Ruleaza
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3.5 py-1.5 text-sm font-semibold text-sky-300 transition hover:border-sky-400/60 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? "Salvez..." : "Salveaza"}
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-1.5 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              title="Autentifica-te pentru a salva proiectul"
            >
              <LogIn className="h-3.5 w-3.5" /> Login
            </Link>
          )}
        </div>
      </div>

      {isDesktop ? (
        <div className="flex min-h-0 flex-1">
          {activityBar}
          <div className="min-h-0 flex-1">
            {!sidebarCollapsed ? (
              <Group orientation="horizontal" className="h-full">
                <Panel defaultSize="18" minSize="12">
                  {sidebar}
                </Panel>
                <Separator className={RESIZE_HANDLE_V} />
                <Panel defaultSize="82" minSize="40">
                  {editorAndPanel}
                </Panel>
              </Group>
            ) : (
              editorAndPanel
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2 pt-1.5">
            <PanelTabButton
              label="EXPLORER"
              active={sidebarView === "explorer" && !sidebarCollapsed}
              onClick={() => {
                setSidebarView("explorer");
                setSidebarCollapsed((prev) => (sidebarView === "explorer" ? !prev : false));
              }}
            />
            <PanelTabButton
              label="PROIECTE"
              active={sidebarView === "projects" && !sidebarCollapsed}
              onClick={() => {
                setSidebarView("projects");
                setSidebarCollapsed((prev) => (sidebarView === "projects" ? !prev : false));
              }}
            />
          </div>
          {!sidebarCollapsed ? <div className="max-h-[35vh] overflow-y-auto border-b border-zinc-800">{sidebar}</div> : null}
          <div className="min-h-0 flex-1 overflow-y-auto">{editorAndPanel}</div>
        </div>
      )}

      {statusBar}
    </main>
  );
}

function ActivityIcon({
  icon: Icon,
  label,
  active,
  accent,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition ${
        accent
          ? "text-emerald-400 hover:bg-emerald-500/10"
          : active
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
      }`}
    >
      {active ? <span className="absolute left-0 top-1.5 h-7 w-0.5 rounded-full bg-sky-400" /> : null}
      <Icon className="h-5 w-5" />
    </button>
  );
}

function ExplorerFolderRow({
  name,
  depth,
  collapsed,
  renaming,
  onToggle,
  onStartRename,
  onCommitRename,
  onDelete,
}: {
  name: string;
  depth: number;
  collapsed: boolean;
  renaming: boolean;
  onToggle: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const paddingLeft = 8 + depth * 14;

  if (renaming) {
    return (
      <div className="flex items-center gap-1.5 rounded px-2 py-1 text-xs" style={{ paddingLeft }}>
        <Folder className="h-3.5 w-3.5 text-sky-400" />
        <input
          ref={inputRef}
          defaultValue={name}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommitRename(event.currentTarget.value);
            if (event.key === "Escape") onCommitRename(name);
          }}
          onBlur={(event) => onCommitRename(event.currentTarget.value)}
          className="min-w-0 flex-1 rounded border border-sky-500 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100 outline-none"
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-1 rounded px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800/60">
      <button type="button" onClick={onToggle} onDoubleClick={onStartRename} className="flex min-w-0 flex-1 items-center gap-1 text-left" style={{ paddingLeft }}>
        {collapsed ? <ChevronRight className="h-3 w-3 shrink-0 text-zinc-500" /> : <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />}
        {collapsed ? <Folder className="h-3.5 w-3.5 shrink-0 text-sky-400" /> : <FolderOpen className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
        <span className="truncate font-mono font-semibold">{name}</span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStartRename();
          }}
          className="rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-200"
          title="Redenumeste"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="rounded p-0.5 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-400"
          title="Sterge folderul"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ExplorerRow({
  icon,
  label,
  depth,
  active,
  renaming,
  onClick,
  onStartRename,
  onCommitRename,
  onDelete,
}: {
  icon: React.ReactNode;
  label: string;
  depth: number;
  active: boolean;
  renaming: boolean;
  onClick: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const paddingLeft = 8 + depth * 14 + 16;

  if (renaming) {
    return (
      <div className="flex items-center gap-1.5 rounded px-2 py-1 text-xs" style={{ paddingLeft }}>
        {icon}
        <input
          ref={inputRef}
          defaultValue={label}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommitRename(event.currentTarget.value);
            if (event.key === "Escape") onCommitRename(label);
          }}
          onBlur={(event) => onCommitRename(event.currentTarget.value)}
          className="min-w-0 flex-1 rounded border border-sky-500 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100 outline-none"
        />
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center justify-between gap-1 rounded px-2 py-1 text-xs transition ${
        active ? "bg-sky-500/15 text-sky-200" : "text-zinc-300 hover:bg-zinc-800/60"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={onStartRename}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        style={{ paddingLeft }}
      >
        {icon}
        <span className="truncate font-mono">{label}</span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStartRename();
          }}
          className="rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-200"
          title="Redenumeste"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="rounded p-0.5 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-400"
          title="Sterge"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function PanelTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 border-b-2 px-1 pb-2 text-[11px] font-bold tracking-wide transition ${
        active ? "border-sky-400 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
