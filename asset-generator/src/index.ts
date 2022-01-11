// TODO: This does work on import. I should really change that... later
import { builder as dehn_builder } from "./builders/dehn_invariant";
import { builder as hydra_builder } from "./builders/hydra";

dehn_builder.generateAll();
hydra_builder.generateAll();