/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';

// Récupération de la clé API depuis le fichier .env
const API_KEY = import.meta.env.VITE_GEMINI_KEY;

// Structure d'une entrée dans le "Trésor"
interface TresorEntry {
  demande_initiale: string;
  choix_mode: string;
  version_expert: string;
}

function App() {
  // --- ÉTATS (STATES) ---
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tresor, setTresor] = useState<TresorEntry[]>([]);
  const [mode, setMode] = useState('traduire'); 
  const [correctionExpert, setCorrectionExpert] = useState('');
  const [nomModele] = useState('models/gemini-1.5-flash');

  // --- CHARGEMENT DE LA MÉMOIRE ---
  useEffect(() => {
    const memoire = localStorage.getItem('zarlor_memoire');
    if (memoire) {
      try {
        setTresor(JSON.parse(memoire));
      } catch (e) {
        console.error("Erreur de lecture de la mémoire", e);
      }
    }
  }, []);

  // --- FONCTION : AJOUTER AU TRÉSOR ---
  const ajouterAuTresor = () => {
    if (!input || !correctionExpert) {
      alert("Il faut une demande initiale et une correction d'expert pour enrichir le Trésor !");
      return;
    }

    const nouvelleEntree: TresorEntry = { 
      demande_initiale: input, 
      choix_mode: mode,
      version_expert: correctionExpert 
    };

    const nouvelleMemoire = [...tresor, nouvelleEntree];
    setTresor(nouvelleMemoire);
    localStorage.setItem('zarlor_memoire', JSON.stringify(nouvelleMemoire));
    
    alert("Pierre ajoutée au Trésor ! ✨ La mémoire de l'IA est enrichie.");
    setCorrectionExpert(''); // On vide la zone expert pour la suite
  };

  // --- FONCTION : APPEL À L'IA (SIBLIMÉ) ---
  const handleSublime = async () => {
    if (!input) return;
    setLoading(true);
    setOutput(''); 
    setCorrectionExpert(''); 

    const exemplesTresor = tresor.length > 0 
      ? "\nCONNAISSANCES ACQUISES (Modèles à suivre) :\n" + 
        tresor.map(t => `Demande: ${t.demande_initiale} [Mode: ${t.choix_mode}] -> RÉPONSE VALIDÉE: ${t.version_expert}`).join("\n")
      : "";

    const promptSysteme = `Tu es l'expert linguistique UDIR 77. 
    Ta mission est de produire un texte parfait en Graphie 77.
    Mode actuel : ${mode}.
    ${exemplesTresor}
    Règles : Respecte les élisions, les traits d'union et le rythme réunionnais authentique.`;

    try {
      // Note : on utilise v1beta ou v1 selon la dispo de votre compte
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${nomModele}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `${promptSysteme}\n\nVoici la nouvelle demande : ${input}` }] 
          }]
        })
      });

      const data = await response.json();

      // SI GOOGLE RENVOIE UNE ERREUR (Clé, Facturation, etc.)
      if (!response.ok) {
        throw new Error(data.error?.message || "Erreur API Google");
      }

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setOutput(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error("L'IA a renvoyé une réponse vide.");
      }

    } catch (err: any) {
      console.error("Erreur détaillée:", err);
      // ICI : on affiche le VRAI message d'erreur dans l'interface
      setOutput(`Détail : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- INTERFACE (RENDU) ---
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#fdfaf4', minHeight: '100vh', color: '#2c3e50' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#d35400', fontSize: '2.5rem', marginBottom: '5px' }}>Zarlor la Lang 💎</h1>
        <p style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Outil d'apprentissage souverain - Graphie UDIR 77</p>
      </header>

      {/* SECTION SAISIE */}
      <section style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. Choisissez votre intention :</label>
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', fontSize: '1rem' }}
        >
          <option value="traduire">Traduire du Français vers le Créole 77</option>
          <option value="proposer">Proposer une expression à partir d'une idée</option>
          <option value="corriger">Corriger un texte créole vers la norme 77</option>
        </select>

        <textarea 
          style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '1.1rem', boxSizing: 'border-box' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre texte ici..."
        />
        
        <button 
          onClick={handleSublime} 
          disabled={loading} 
          style={{ width: '100%', padding: '18px', background: '#d35400', color: 'white', marginTop: '15px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: '0.3s' }}
        >
          {loading ? "L'IA ANALYSE LE TRÉSOR..." : "SIBLIMÉ 🚀"}
        </button>
      </section>

      {/* SECTION RÉSULTATS */}
      {output && (
        <section style={{ marginTop: '30px' }}>
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '8px solid #d35400', marginBottom: '25px' }}>
            <h3 style={{ marginTop: 0, color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' }}>Proposition de l'IA</h3>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#2c3e50' }}>{output}</p>
          </div>

          <div style={{ padding: '25px', background: 'white', border: '2px solid #ffd700', borderRadius: '15px', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#d35400' }}>Validation de l'Expert (Souverain)</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Saisissez ci-dessous la version parfaite. C'est elle qui sera mémorisée.</p>
            <textarea 
              style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #ffd700', fontSize: '1.1rem', boxSizing: 'border-box', backgroundColor: '#fffdf0' }}
              value={correctionExpert}
              onChange={(e) => setCorrectionExpert(e.target.value)}
              placeholder="Écrivez ici la correction finale..."
            />
            <button 
              onClick={ajouterAuTresor} 
              style={{ width: '100%', marginTop: '15px', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              GRAVER DANS LE TRÉSOR ✨
            </button>
          </div>
        </section>
      )}
      
      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#bdc3c7', fontSize: '0.8rem' }}>
        Mémoire actuelle : {tresor.length} pierre(s) précieuse(s) dans le Trésor.
      </footer>
    </div>
  );
}

export default App;
