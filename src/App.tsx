import React, { useState, useEffect } from 'react';
import { MATIERE_LITTERAIRE } from './matiere';

//const API_KEY = "AIzaSyAJxomPhJJt03M_KyI_rsHP_dT0Li6Lpos"; 
const API_KEY = import.meta.env.VITE_GEMINI_KEY;

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tresor, setTresor] = useState<string[]>([]);
  const [nomModele, setNomModele] = useState('models/gemini-2.5-flash');

  // 1. AU DÉMARRAGE : On charge la mémoire ET on cherche le bon modèle
  useEffect(() => {
    const memoire = localStorage.getItem('zarlor_memoire');
    if (memoire) setTresor(JSON.parse(memoire));
    trouverLeBonModele();
  }, []);

  // 2. LE SCANNER AUTOMATIQUE (Il cherche ce qui marche pour TA clé)
  const trouverLeBonModele = async () => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
      const data = await response.json();
      if (data.models) {
        // On cherche un modèle qui contient "flash" ou "pro"
        const bon = data.models.find((m: any) => m.name.includes('flash') || m.name.includes('pro'));
        if (bon) setNomModele(bon.name);
      }
    } catch (e) { console.log("Erreur scan"); }
  };

  const ajouterAuTresor = () => {
    if (!output) return;
    const nouvelleMemoire = [...tresor, output];
    setTresor(nouvelleMemoire);
    localStorage.setItem('zarlor_memoire', JSON.stringify(nouvelleMemoire));
    alert("Ajouté au Zarlor ! ✨");
  };

  const handleSublime = async () => {
    if (!input) return;
    setLoading(true);
    setOutput("");

    const exemplesTresor = tresor.length > 0 
      ? "\nExemples validés :\n" + tresor.join("\n")
      : "";

    const instructions = `INTERDICTION DE RÉPONDRE EN FRANÇAIS. Expert UDIR Graphie 77. 
    Règles : Pas d'apostrophes, agglutination (ex: lamer, lakour), pas de 'un', ne cite jamais d'auteurs.
    Matière : ${MATIERE_LITTERAIRE} ${exemplesTresor}
    Texte à transformer : ${input}`;

    try {
      // ON UTILISE LE NOM TROUVÉ PAR LE SCANNER
      const url = `https://generativelanguage.googleapis.com/v1beta/${nomModele}:generateContent?key=${API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }] })
      });

      const data = await response.json();

      if (data.error) {
        setOutput("Désolé, Google dit : " + data.error.message);
      } else if (data.candidates) {
        setOutput(data.candidates[0].content.parts[0].text);
      }
    } catch (error) {
      setOutput("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif', backgroundColor: '#fdfaf4', minHeight: '100vh' }}>
      <h1 style={{ color: '#d35400', textAlign: 'center' }}>Zarlor la Lang 💎</h1>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>Modele actif : {nomModele}</p>
      
      <textarea 
        style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '1.1rem' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Écrivez ici..."
      />
      
      <button onClick={handleSublime} disabled={loading} style={{ width: '100%', padding: '15px', background: '#d35400', color: 'white', marginTop: '10px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
        {loading ? "RÉFLEXION EN COURS..." : "SIBLIMÉ"}
      </button>

      {output && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderLeft: '10px solid #27ae60', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.2rem' }}>{output}</p>
          <button onClick={ajouterAuTresor} style={{ marginTop: '15px', background: '#27ae60', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
            ✅ VALIDER (Ajouter à la mémoire)
          </button>
        </div>
      )}

      {tresor.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <p style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Mémoire : {tresor.length} phrase(s) enregistrée(s).</p>
        </div>
      )}
    </div>
  );
}

export default App;