import * as m001 from "./001-init.mjs";
import * as m002 from "./002-config-tables.mjs";
import * as m003 from "./003-drop-documents.mjs";

export const migrations = [m001, m002, m003].sort((a, b) => a.version - b.version);
