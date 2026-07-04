const API_URL = "http://127.0.0.1:5000";

function loadExampleDrug() {
    document.getElementById('smiles').value = "CC(=O)Oc1ccccc1C(=O)O";
}

function loadExampleProtein() {
    document.getElementById('fasta').value = 
`>EGFR (Epidermal Growth Factor Receptor)
MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTCPPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGIGIGEFKDSLSINATNIKHFKNCTSISGDLHILPVAFRGDSFTHTPPLDPQELDILKTVKEITGFLLIQAWPENRTDLHAFENLEIIRGRTKQHGQFSLAVVSLNITSLGLRSLKEISDGDVIISGNKNLCYANTINWKKLFGTSGQKTKIISNRGENSCKATGQVCHALCSPEGCWGPEPRDCVSCRNVSRGRECVDKCNLLEGEPREFVENSECIQCHPECLPQAMNITCTGRGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLEGCPTNGPKIPSIATGMVGALLLLLVVALGIGLFMRRRHIVRKRTLRRLLQERELVEPLTPSGEAPNQALLRILKETEFKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA`;
}

async function predictInteraction() {
    const smiles = document.getElementById('smiles').value.trim();
    const fasta = document.getElementById('fasta').value.trim();
    
    if (!smiles || !fasta) {
        alert("⚠️ Please enter both Drug SMILES and Protein FASTA sequence!");
        return;
    }

    const btn = document.getElementById('predictBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ smiles, fasta })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('affinityValue').textContent = result.affinity_score;
            document.getElementById('interpretation').textContent = result.interpretation;
            document.getElementById('confidence').textContent = `Confidence: ${result.confidence}`;
            document.getElementById('resultCard').style.display = 'block';
        } else {
            alert("Error: " + (result.error || "Prediction failed"));
        }
    } catch (error) {
        console.error(error);
        alert("Could not connect to backend. Make sure the backend server is running on port 5000.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function resetForm() {
    document.getElementById('smiles').value = '';
    document.getElementById('fasta').value = '';
    document.getElementById('resultCard').style.display = 'none';
}

function handleSmilesUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('smiles').value = e.target.result.trim();
    };
    reader.readAsText(file);
}

function handleFastaUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('fasta').value = e.target.result.trim();
    };
    reader.readAsText(file);
}