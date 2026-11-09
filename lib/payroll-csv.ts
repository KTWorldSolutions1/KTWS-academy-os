/** Escape spreadsheet cells, including formulas hidden behind whitespace. */
export function payrollCsvCell(value:unknown){
 const text=String(value??'');
 const safe=/^\s*[=+@-]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
