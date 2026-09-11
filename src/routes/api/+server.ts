import { json } from "@sveltejs/kit";
import data from "./AP_68358072907119137350_Rules.json" with { type: "json" };

export function GET() {
    return json(data);
}
