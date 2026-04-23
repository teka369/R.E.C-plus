#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const roots = [
	path.join(process.cwd(), "app"),
	path.join(process.cwd(), "components"),
];

/** Orden: cadenas más largas primero */
const pairs = [
	["ring-1 ring-emerald-200", "ring-1 ring-rec-success-border"],
	["bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", "bg-rec-success-bg text-rec-success-text ring-1 ring-rec-success-border"],
	["bg-emerald-50 text-emerald-700", "bg-rec-success-bg text-rec-success-text"],
	["border-emerald-200", "border-rec-success-border"],
	["bg-emerald-100", "bg-rec-success-bg-muted"],
	["bg-emerald-50", "bg-rec-success-bg"],
	["text-emerald-700", "text-rec-success-text"],
	["text-emerald-800", "text-rec-success-text"],
	["bg-emerald-600", "bg-rec-primary"],
	["bg-emerald-700", "bg-rec-primary-strong"],
	["hover:bg-emerald-700", "hover:bg-rec-primary-strong"],
	["hover:bg-emerald-800", "hover:bg-rec-primary-strong"],
	["text-emerald-600", "text-rec-primary"],
	["border-emerald-300", "border-rec-success-border"],

	["bg-red-50", "bg-rec-danger-bg"],
	["bg-red-100", "bg-rec-danger-bg-strong"],
	["text-red-600", "text-rec-danger-text"],
	["text-red-700", "text-rec-danger-text"],
	["text-red-800", "text-rec-danger-text"],
	["border-red-200", "border-rec-danger-border"],
	["border-red-300", "border-rec-danger-border"],
	["bg-red-600", "bg-rec-danger-solid"],
	["hover:bg-red-700", "hover:bg-rec-danger-solid-hover"],
	["text-red-500", "text-rec-danger-text"],
	["ring-red-200", "ring-rec-danger-border"],

	["bg-amber-50", "bg-rec-warning-bg"],
	["text-amber-700", "text-rec-warning-text"],
	["text-amber-800", "text-rec-warning-text"],
	["border-amber-200", "border-rec-warning-border"],
	["border-amber-300", "border-rec-warning-border"],

	["bg-sky-50", "bg-rec-info-bg"],
	["bg-sky-100", "bg-rec-info-bg-strong"],
	["text-sky-700", "text-rec-info-text"],
	["text-sky-800", "text-rec-info-text"],
	["hover:bg-sky-200", "hover:bg-rec-info-hover"],
	["border-sky-200", "border-rec-info-border"],

	["bg-blue-50", "bg-rec-info-bg"],
	["bg-blue-100", "bg-rec-info-bg-strong"],
	["text-blue-700", "text-rec-info-text"],
	["text-blue-800", "text-rec-info-text"],
	["border-blue-200", "border-rec-info-border"],
	["border-blue-300", "border-rec-info-border"],

	["bg-green-50", "bg-rec-success-bg"],
	["text-green-700", "text-rec-success-text"],
	["text-green-800", "text-rec-success-text"],
	["border-green-200", "border-rec-success-border"],

	["bg-orange-50", "bg-rec-warning-bg"],
	["text-orange-700", "text-rec-warning-text"],
	["border-orange-200", "border-rec-warning-border"],

	["bg-yellow-50", "bg-rec-warning-bg"],
	["text-yellow-800", "text-rec-warning-text"],
	["border-yellow-200", "border-rec-warning-border"],

	["text-slate-900", "text-rec-text-primary"],
	["text-slate-800", "text-rec-text-primary"],
	["text-slate-700", "text-rec-text-secondary"],
	["text-slate-600", "text-rec-text-muted"],
	["text-slate-500", "text-rec-text-subtle"],
	["text-slate-400", "text-rec-text-subtle"],
	["bg-slate-50", "bg-rec-bg-base"],
	["bg-slate-100", "bg-rec-bg-muted"],
	["bg-slate-200", "bg-rec-bg-subtle"],
	["border-slate-200", "border-rec-border-default"],
	["border-slate-300", "border-rec-border-strong"],
	["ring-slate-200", "ring-rec-border-default"],
	["ring-slate-200/80", "ring-rec-border-default/80"],
	["hover:bg-slate-100", "hover:bg-rec-bg-muted"],
	["hover:bg-slate-50", "hover:bg-rec-bg-base"],
	["divide-slate-200", "divide-rec-border-default"],

	["text-gray-900", "text-rec-text-primary"],
	["text-gray-800", "text-rec-text-primary"],
	["text-gray-700", "text-rec-text-secondary"],
	["text-gray-600", "text-rec-text-muted"],
	["text-gray-500", "text-rec-text-subtle"],
	["bg-gray-50", "bg-rec-bg-base"],
	["bg-gray-100", "bg-rec-bg-muted"],
	["bg-gray-200", "bg-rec-bg-subtle"],
	["border-gray-200", "border-rec-border-default"],
	["border-gray-300", "border-rec-border-strong"],
	["hover:bg-gray-100", "hover:bg-rec-bg-muted"],
	["hover:bg-gray-50", "hover:bg-rec-bg-base"],
	["divide-gray-200", "divide-rec-border-default"],

	["bg-white/95", "bg-rec-bg-elevated/95"],
	["bg-white/90", "bg-rec-bg-elevated/90"],
	["bg-white/85", "bg-rec-bg-elevated/85"],
	["bg-white/80", "bg-rec-bg-elevated/80"],
	["bg-white/70", "bg-rec-bg-elevated/70"],
	["bg-white/60", "bg-rec-bg-elevated/60"],
	["bg-white/50", "bg-rec-bg-elevated/50"],
	["bg-white/20", "bg-rec-bg-elevated/20"],
	["bg-white/10", "bg-rec-bg-elevated/10"],
	["border-white/50", "border-rec-text-on-media/50"],
	["border-white/30", "border-rec-text-on-media/30"],
	["border-white/20", "border-rec-text-on-media/20"],
	["text-white/95", "text-rec-text-on-media/95"],
	["text-white/90", "text-rec-text-on-media/90"],
	["text-white/85", "text-rec-text-on-media/85"],
	["text-white/80", "text-rec-text-on-media/80"],
	["text-white/70", "text-rec-text-on-media/70"],
	["text-white/50", "text-rec-text-on-media/50"],
	["text-white/45", "text-rec-text-on-media/45"],
	["text-white", "text-rec-text-on-media"],

	["bg-white", "bg-rec-bg-elevated"],
	["text-black", "text-rec-text-primary"],
	["border-black", "border-rec-text-primary"],

	["bg-black/40", "bg-rec-text-primary/40"],
	["bg-black/50", "bg-rec-text-primary/50"],
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

let totalFiles = 0;
let totalRepl = 0;

for (const root of roots) {
	for (const file of walk(root)) {
		let s = fs.readFileSync(file, "utf8");
		const orig = s;
		for (const [a, b] of pairs) {
			const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
			const n = (s.match(re) || []).length;
			if (n) {
				s = s.replace(re, b);
				totalRepl += n;
			}
		}
		if (s !== orig) {
			fs.writeFileSync(file, s);
			totalFiles++;
		}
	}
}

console.log(`Updated ${totalFiles} files, ~${totalRepl} replacements.`);
