#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const roots = [path.join(process.cwd(), "app"), path.join(process.cwd(), "components")];

const pairs = [
	["border-slate-100", "border-rec-border-subtle"],
	["divide-slate-100", "divide-rec-border-subtle"],
	["border-slate-50", "border-rec-bg-muted"],
	["bg-slate-900/45", "bg-rec-ink/45"],
	["bg-slate-900", "bg-rec-ink"],
	["bg-black/45", "bg-rec-ink/45"],
	["bg-black/5", "bg-rec-text-primary/5"],
	["text-slate-300", "text-rec-text-subtle"],
	["focus:ring-emerald-200", "focus:ring-rec-success-border"],
	["focus:ring-emerald-400", "focus:ring-rec-primary"],
	["focus:border-emerald-500", "focus:border-rec-primary"],
	["text-emerald-500", "text-rec-primary"],
	["text-emerald-900", "text-rec-text-primary"],
	["border-l-emerald-500", "border-l-rec-chart-emerald"],
	["border-l-sky-500", "border-l-rec-chart-cyan"],
	["shadow-emerald-900/30", "shadow-rec-primary/25"],
	["border-emerald-600/50", "border-rec-primary/50"],
	["border-emerald-600/40", "border-rec-primary/40"],
	["text-emerald-100/90", "text-rec-text-on-media/90"],
	["text-emerald-100/95", "text-rec-text-on-media/95"],
	["bg-emerald-800/60", "bg-rec-primary-strong/55"],
	["bg-slate-400", "bg-rec-text-subtle"],
	["bg-slate-300", "bg-rec-text-muted"],
	["bg-amber-400", "bg-rec-chart-amber"],
	["bg-indigo-100 border-l-indigo-500 text-indigo-900", "bg-rec-info-bg border-l-rec-role-primary text-rec-text-primary"],
	["bg-amber-100 border-l-amber-500 text-amber-900", "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary"],
	["bg-rose-100 border-l-rose-500 text-rose-900", "bg-rec-danger-bg border-l-rec-chart-rose text-rec-text-primary"],
	["bg-violet-100 border-l-violet-500 text-violet-900", "bg-rec-role-surface border-l-rec-role-primary text-rec-text-primary"],
	["bg-teal-100 border-l-teal-500 text-teal-900", "bg-rec-success-bg border-l-rec-chart-cyan text-rec-text-primary"],
	["bg-orange-100 border-l-orange-500 text-orange-900", "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary"],
	["bg-rec-success-bg-muted border-l-emerald-500 text-emerald-900", "bg-rec-success-bg-muted border-l-rec-chart-emerald text-rec-text-primary"],
	["bg-rec-info-bg-strong border-l-sky-500 text-sky-900", "bg-rec-info-bg-strong border-l-rec-chart-cyan text-rec-text-primary"],
];

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir)) {
		const p = path.join(dir, name);
		const st = fs.statSync(p);
		if (st.isDirectory()) {
			if (name === "node_modules" || name === ".next") continue;
			walk(p, out);
		} else if (name.endsWith(".tsx")) out.push(p);
	}
	return out;
}

let nFiles = 0;
let nRep = 0;
for (const root of roots) {
	for (const file of walk(root)) {
		let s = fs.readFileSync(file, "utf8");
		const o = s;
		for (const [a, b] of pairs) {
			const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
			const c = (s.match(re) || []).length;
			if (c) {
				s = s.replace(re, b);
				nRep += c;
			}
		}
		if (s !== o) {
			fs.writeFileSync(file, s);
			nFiles++;
		}
	}
}
console.log(`pass2: ${nFiles} files, ~${nRep} replacements`);
