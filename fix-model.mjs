import fs from "fs";

['src/lib/gemini.ts', 'src/services/aiNewsService.ts', 'server.ts'].forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/gemini-3-flash-preview/g, 'gemini-3.5-flash');
  fs.writeFileSync(file, text);
});
