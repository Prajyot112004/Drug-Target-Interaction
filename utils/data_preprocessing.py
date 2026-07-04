import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski
import os

def load_davis_data():
    """Load Davis dataset"""
    file_path = 'data/raw/davis_all.csv'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return None
    
    df = pd.read_csv(file_path)
    print(f"✅ Davis dataset loaded: {df.shape[0]:,} drug-target pairs")
    print(f"Columns: {list(df.columns)}")
    return df

def smiles_to_mol(smiles):
    """Convert SMILES to RDKit molecule"""
    if pd.isna(smiles):
        return None
    mol = Chem.MolFromSmiles(str(smiles))
    return mol

def extract_drug_features(smiles):
    """Extract basic chemical features using RDKit"""
    mol = smiles_to_mol(smiles)
    if mol is None:
        return None
    
    try:
        features = {
            'mol_weight': Descriptors.MolWt(mol),
            'logp': Descriptors.MolLogP(mol),
            'num_h_donors': Lipinski.NumHDonors(mol),
            'num_h_acceptors': Lipinski.NumHAcceptors(mol),
            'num_rotatable_bonds': Lipinski.NumRotatableBonds(mol),
            'tpsa': Descriptors.TPSA(mol),
            'num_rings': Descriptors.RingCount(mol),
        }
        return features
    except:
        return None

def extract_protein_features(fasta):
    """Extract simple protein features"""
    if pd.isna(fasta):
        return {'protein_length': 0}
    
    # Remove header if present (>...)
    seq = str(fasta).strip()
    if seq.startswith('>'):
        seq = seq.split('\n', 1)[-1]
    
    seq = seq.replace('\n', '').strip()
    return {
        'protein_length': len(seq),
        'num_basic': seq.count('K') + seq.count('R') + seq.count('H'),
        'num_acidic': seq.count('D') + seq.count('E'),
    }

def preprocess_dti_data(df, dataset_name="davis"):
    """Preprocess the full dataset"""
    print(f"\n🔄 Extracting features from {dataset_name} dataset...")
    
    drug_features = []
    protein_features = []
    affinities = []
    
    for idx, row in df.iterrows():
        if idx % 5000 == 0 and idx > 0:
            print(f"  Processed {idx:,} pairs...")
        
        # Drug features
        drug_feat = extract_drug_features(row['compound_iso_smiles'])
        if drug_feat is None:
            continue  # skip invalid molecules
        
        # Protein features
        prot_feat = extract_protein_features(row['target_sequence'])
        
        # Combine features
        combined = {**drug_feat, **prot_feat}
        combined['affinity'] = float(row['affinity'])
        
        drug_features.append(combined)
    
    processed_df = pd.DataFrame(drug_features)
    
    print(f"✅ Successfully processed {len(processed_df):,} valid pairs")
    print("\nFeature columns:", list(processed_df.columns))
    print(processed_df.describe().round(2))
    
    # Save processed data
    os.makedirs('data/processed', exist_ok=True)
    output_path = f'data/processed/processed_{dataset_name}.csv'
    processed_df.to_csv(output_path, index=False)
    print(f"💾 Saved to: {output_path}")
    
    return processed_df

# Main execution
if __name__ == "__main__":
    print("🚀 Starting DTI Data Preprocessing...\n")
    
    df_davis = load_davis_data()
    if df_davis is not None:
        processed_davis = preprocess_dti_data(df_davis, "davis")
        
        # Optional: Process a small sample first for faster testing
        # sample = df_davis.head(1000)
        # preprocess_dti_data(sample, "davis_sample")