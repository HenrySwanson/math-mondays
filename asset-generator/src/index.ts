// TODO: This does work on import. This means that `npm test` also regenerates
// the files. I should really change that... later.
const dehn = require("./builders/dehn_invariant.js");

export function hello(name: string): string {
	return `Hello ${name}`;
}