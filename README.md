# TureXGo

O aplicatie web pentru planificarea graficului de munca in regim **2/2** (2 zile de lucru, 2 zile libere, ture de 12 ore).

> A web app for planning a **2/2 work rotation** schedule (2 days on, 2 days off, 12-hour shifts).

---

## Functionalitati

- **Calendar 6 luni** — genereaza automat graficul urmatorilor 6 luni
- **Zile verzi** = zile de lucru (cu intervalul orar)
- **Zile rosii** = zile libere
- **Click pe orice zi** pentru a o modifica manual (inlocuiri, schimburi)
- **Export Excel** — descarca graficul in format .xlsx pentru orice numar de luni (1–12)
- **Pauze calculate automat** — 3 × 30 min, distribuite rational (salvate in Excel)
- Design dark, stil IT profesional

---

## Pornire rapida

```bash
# 1. Instaleaza dependintele
npm install

# 2. Porneste aplicatia in modul development
npm run dev

# 3. Deschide in browser
# http://localhost:5173
```

---

## Build pentru productie

```bash
npm run build
npm run preview
```

Fisierele finale se genereaza in folderul `dist/`.

---

## Cum se foloseste

1. **Introdu numele** tau (va aparea in fisierul Excel exportat)
2. **Seteaza ora de inceput si sfarsit** a turei (ex: 07:00 – 19:00)
3. **Marcheaza zilele din saptamana trecuta** in care ai lucrat (click pe L, Ma, Mi, J, V, S, D)
4. Apasa **"Genereaza"** — apare calendarul pe 6 luni
5. **Click pe orice zi** pentru a schimba tipul (lucru ↔ liber) — util pentru inlocuiri
6. Alege numarul de luni si apasa **"Descarca Excel"**

---

## Reguli pauze (salvate in Excel)

- Total: **90 minute** pauza pe tura
- **Nu** in primele 2 ore de munca
- **Nu** in ultima ora de munca
- Distributie: 3 pauze × 30 min la ora +2h30, +5h30, +8h30 fata de start

---

## Stack tehnic

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [date-fns](https://date-fns.org/)
- [xlsx (SheetJS)](https://sheetjs.com/)
- [lucide-react](https://lucide.dev/)

---

## Structura proiect

```
work-schedule-app/
├── src/
│   ├── lib/
│   │   ├── schedule.ts   # Logica rotatiei 2/2 si calculul pauzelor
│   │   └── export.ts     # Export Excel cu SheetJS
│   ├── pages/
│   │   └── home.tsx      # Pagina principala cu calendarul
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css         # Tema dark (Tailwind v4)
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## Licenta

MIT
