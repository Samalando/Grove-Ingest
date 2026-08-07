import { createRoot } from "react-dom/client"
import Home from "./webui"

const root = document.getElementById("root")
if (!root) throw new Error("missing #root element")

createRoot(root).render(<Home />)