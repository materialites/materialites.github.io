// Carte des concepts : un clic = la phrase du concept ; un deuxième clic = une question qui relie les deux, et trois contenus.
(() => {
  const svg = document.getElementById("carte-svg"), panneau = document.getElementById("carte-panneau");
  const NS = "http://www.w3.org/2000/svg", { noeuds, liens, paires, familles } = CARTE;
  const parId = Object.fromEntries(noeuds.map(n => [n.id, n]));
  const cle = (a, b) => [a, b].sort().join("+");
  const voisins = id => liens.filter(l => l.a === id || l.b === id).map(l => (l.a === id ? l.b : l.a));
  const echap = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let choix = [];

  const el = (tag, attrs, parent) => {
    const x = document.createElementNS(NS, tag);
    for (const k in attrs) x.setAttribute(k, attrs[k]);
    parent.appendChild(x);
    return x;
  };
  const gLiens = el("g", {}, svg), gNoeuds = el("g", {}, svg);
  const traits = liens.map(l => {
    const a = parId[l.a], b = parId[l.b];
    // au repos, seuls les liens forts (5 réfs communes ou plus) sont tracés ; les autres apparaissent au clic
    return Object.assign(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: l.n >= 5 ? "lien" : "lien faible" }, gLiens), { lien: l });
  });
  const rayon = n => 7 + Math.sqrt(n.n) * 0.9;
  const points = noeuds.map(n => {
    const g = el("g", { class: "noeud", tabindex: 0, role: "button", "aria-label": n.nom, transform: `translate(${n.x},${n.y})` }, gNoeuds);
    el("circle", { r: rayon(n), fill: familles[n.f].couleur }, g);
    const t = el("text", { x: 0, y: -rayon(n) - 6, "text-anchor": "middle" }, g);
    t.textContent = n.nom.length > 30 ? n.nom.slice(0, 28) + "…" : n.nom;
    g.onclick = () => cliquer(n.id);
    g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cliquer(n.id); } };
    return Object.assign(g, { noeud: n });
  });

  const blocConcept = n => `<div class="panneau-concept" style="--f:${familles[n.f].couleur}">
    <h3>${echap(n.nom)}</h3><p>${echap(n.a)}</p><a href="concepts/${n.id}.html">${n.n} références →</a></div>`;

  function dessiner() {
    const [a, b] = choix;
    svg.classList.toggle("choix", choix.length > 0);
    const proches = a ? new Set([a, ...voisins(a)]) : new Set();
    points.forEach(p => {
      p.classList.toggle("choisi", choix.includes(p.noeud.id));
      p.classList.toggle("eteint", b ? !choix.includes(p.noeud.id) : !!a && !proches.has(p.noeud.id));
    });
    traits.forEach(t => t.classList.toggle("voisin", !!a && (b ? cle(t.lien.a, t.lien.b) === cle(a, b) : t.lien.a === a || t.lien.b === a)));
    if (!a) { panneau.innerHTML = '<p class="panneau-aide">Choisissez un premier concept sur la carte.</p>'; return; }
    let h = blocConcept(parId[a]);
    if (!b) {
      h += `<p class="panneau-aide">Choisissez un deuxième concept : ceux qui restent nets partagent des références avec celui-ci.</p>`;
    } else {
      h += blocConcept(parId[b]);
      const p = paires[cle(a, b)];
      h += p ? `<p class="panneau-q ${p.ecrite ? "" : "panneau-q-auto"}">${echap(p.q)}</p><div class="panneau-refs">${p.refs.join("")}</div>
               <p><a class="panneau-tout" href="${p.url}">Les ${p.n} références de ce croisement →</a></p>`
             : `<p class="panneau-aide">Pas encore assez de références qui croisent ces deux concepts. Essayez un concept relié par un trait.</p>`;
    }
    panneau.innerHTML = h + '<button class="lien-bouton" type="button">Recommencer</button>';
    panneau.querySelector(".lien-bouton").onclick = () => { choix = []; dessiner(); };
  }

  function cliquer(id) {
    if (choix.includes(id)) choix = choix.filter(x => x !== id);
    else choix = choix.length >= 2 ? [id] : [...choix, id];
    dessiner();
  }
})();
