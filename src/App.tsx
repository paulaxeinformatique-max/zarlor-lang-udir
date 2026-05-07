/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';

// Récupération sécurisée de la clé API 
const API_KEY = import.meta.env.VITE_GEMINI_KEY;

// Structure pour conserver le contexte (Demande + Mode + Correction) [cite: 16]
interface TresorEntry {
  demande_initiale: string;
  choix_mode: string;
  version_expert: string;
}

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tresor, setTresor] = useState<TresorEntry[]>([]); // Gère les objets du Trésor [cite: 17]
  const [nomModele] = useState('models/gemini-1.5-flash'); 
  const [mode, setMode] = useState('traduire'); 
  const [correctionExpert, setCorrectionExpert] = useState('');

  // Chargement de la mémoire locale au démarrage [cite: 19]
  useEffect(() => {
    const memoire = localStorage.getItem('zarlor_memoire');
    if (memoire) setTresor(JSON.parse(memoire));
  }, []);

  // Fonction pour graver la version de l'expert dans le Trésor [cite: 20, 22]
  const ajouterAuTresor = () => {
    if (!input || !correctionExpert) {
      alert("Il faut une demande et une correction d'expert !");
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
    alert("Pierre ajoutée au Trésor ! ✨");
    setCorrectionExpert(''); // Prépare la zone pour la suite [cite: 22, 23]
  };

  // Fonction principale d'appel à l'IA [cite: 24, 27]
  const handleSublime = async () => {
    if (!input) return;
    setLoading(true);
    setCorrectionExpert(''); 

    // Préparation des exemples pour l'apprentissage de l'IA [cite: 24, 25]
    const exemplesTresor = tresor.length > 0 
      ? "\nExemples validés par l'expert (UDIR 77) :\n" + 
        tresor.map(t => `Demande: ${t.demande_initiale} -> Correction: ${t.version_expert}`).join("\n")
      : "";

    const promptSysteme = `Tu es l'expert UDIR 77. Mode actuel : ${mode}. ${exemplesTresor}\nRespecte scrupuleusement la graphie 77.`;

try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${nomModele}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${promptSysteme}\n\nTexte à traiter : ${input}` }] }]
        })
      });
      
      const data = await response.json();

      // AJOUT DE CE TEST POUR VOIR L'ERREUR RÉELLE DE GOOGLE
      if (data.error) {
        setOutput(`Erreur Google : ${data.error.message}`);
      } else if (data.candidates && data.candidates[0].content) {
        setOutput(data.candidates[0].content.parts[0].text);
      } else {
        setOutput("L'IA a renvoyé une réponse vide.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setOutput("Erreur de connexion au serveur.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fdfaf4', minHeight: '100vh' }}>
      <h1 style={{ color: '#d35400', textAlign: 'center' }}>Zarlor la Lang 💎</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Option choisie :</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
          <option value="traduire">Traduire en Créole 77</option>
          <option value="proposer">Proposition (Idée)</option>
          <option value="corriger">Corriger texte créole</option>
        </select>
      </div>

      <textarea 
        style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '10px', fontSize: '1rem' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Écrivez ici votre texte ou votre idée..."
      />
     
      <button onClick={handleSublime} disabled={loading} style={{ width: '100%', padding: '15px', background: '#d35400', color: 'white', marginTop: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
        {loading ? "L'IA RÉFLÉCHIT..." : "SIBLIMÉ"}
      </button>

      {output && (
        <div style={{ marginTop: '20px' }}>
          {/* ZONE A : PROPOSITION IA [cite: 33] */}
          <div style={{ padding: '15px', background: '#eee', borderRadius: '8px', marginBottom: '20px' }}>
            <small style={{ color: '#666' }}>Proposition de l'IA :</small>
            <p style={{ fontSize: '1.1rem', margin: '10px 0' }}>{output}</p>
          </div>

          {/* ZONE B : CORRECTION EXPERT [cite: 34] */}
          <div style={{ padding: '15px', background: '#fff', border: '2px solid #ffd700', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold', color: '#d35400' }}>Votre version souveraine (Expert) :</label>
            <textarea 
              style={{ width: '100%', height: '80px', marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}
              value={correctionExpert}
              onChange={(e) => setCorrectionExpert(e.target.value)}
              placeholder="Corrigez ici pour enrichir le Trésor..."
            />
            <button onClick={ajouterAuTresor} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              ENREGISTRER AU TRÉSOR ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;