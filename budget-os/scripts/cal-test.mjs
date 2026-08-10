import { chromium } from "playwright-core";
const EXE="/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT=process.env.PORT||"3980";
const b=await chromium.launch({executablePath:EXE});
const ctx=await b.newContext({viewport:{width:1400,height:1000}});
const p=await ctx.newPage();
await p.addInitScript(()=>{localStorage.setItem("cris-budget-os:profile",JSON.stringify({name:"Test"}));localStorage.setItem("cris-budget-os:mode","demo");localStorage.setItem("cris-budget-os:demo-meta",JSON.stringify({name:"The Santos Family"}));});
const errs=[]; p.on("pageerror",e=>errs.push(String(e)));
await p.goto(`http://localhost:${PORT}/calendar`,{waitUntil:"networkidle"});
await p.waitForTimeout(1200);
console.log("Cash-flow forecast:", await p.getByText("Cash-flow forecast").count()>0);
console.log("Payday Planner:", await p.getByText("Payday Planner").count()>0);
console.log("Projected balance rows:", await p.getByText("Projected balance").count());
// count event emojis in month grid (desktop)
const emojiCount = await p.evaluate(()=>document.querySelectorAll('.grid.grid-cols-7 button span[title]').length);
console.log("Calendar event markers in month grid:", emojiCount);
// Fixed expense monthly-equivalent test
await p.goto(`http://localhost:${PORT}/fixed`,{waitUntil:"networkidle"});
await p.waitForTimeout(600);
const before = await p.evaluate(()=>{const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&/Expected \/ month/i.test(e.textContent||''));return el?el.parentElement.textContent:'';});
await p.fill("input[placeholder='e.g. Apartment rent']","Test Weekly");
await p.fill("input[placeholder='12000']","500");
await p.selectOption("select >> nth=1","weekly");
await p.getByRole("button",{name:/Add Fixed Expense/i}).click();
await p.waitForTimeout(600);
const has = await p.getByText("Weekly").count();
console.log("Weekly expense added & labeled:", has>0);
console.log("pageerrors:", errs.length?errs[0]:"none");
await b.close();
