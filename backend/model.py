import pandas as pd
import numpy as np
import joblib
import os
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski

MODEL_PATH = 'models/saved/dti_xgboost_final.pkl'

# ====================== Feature Extraction ======================
def smiles_to_mol(smiles):
    if pd.isna(smiles) or not smiles:
        return None
    mol = Chem.MolFromSmiles(str(smiles))
    return mol

def extract_drug_features(smiles):
    mol = smiles_to_mol(smiles)
    if mol is None:
        return None
    try:
        return {
            'mol_weight': Descriptors.MolWt(mol),
            'logp': Descriptors.MolLogP(mol),
            'num_h_donors': Lipinski.NumHDonors(mol),
            'num_h_acceptors': Lipinski.NumHAcceptors(mol),
            'num_rotatable_bonds': Lipinski.NumRotatableBonds(mol),
            'tpsa': Descriptors.TPSA(mol),
            'num_rings': Descriptors.RingCount(mol),
        }
    except:
        return None

def extract_protein_features(fasta):
    if not fasta:
        return {'protein_length': 0, 'num_basic': 0, 'num_acidic': 0}
    
    seq = str(fasta).strip()
    if seq.startswith('>'):
        seq = seq.split('\n', 1)[-1]
    seq = seq.replace('\n', '').strip()
    
    return {
        'protein_length': len(seq),
        'num_basic': seq.count('K') + seq.count('R') + seq.count('H'),
        'num_acidic': seq.count('D') + seq.count('E'),
    }

# ====================== Model Training ======================
def train_xgboost():
    data_path = 'data/processed/final_processed_features.csv'
    
    if not os.path.exists(data_path):
        print("⚠️ No training data found. Creating dummy data...")
        create_dummy_data()
    
    df = pd.read_csv(data_path)
    
    feature_cols = [col for col in df.columns if col != 'affinity']
    X = df[feature_cols]
    y = df['affinity']
    
    from sklearn.model_selection import train_test_split
    from xgboost import XGBRegressor
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training on {X_train.shape[0]:,} samples | Testing on {X_test.shape[0]:,}")
    
    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ XGBoost Performance - RMSE: {rmse:.4f} | MAE: {mae:.4f} | R²: {r2:.4f}")
    
    os.makedirs('models/saved', exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"💾 Model saved: {MODEL_PATH}")
    return model

def create_dummy_data():
    """Create dummy data if none exists"""
    os.makedirs('data/processed', exist_ok=True)
    np.random.seed(42)
    n = 200
    data = {
        'mol_weight': np.random.normal(320, 80, n),
        'logp': np.random.normal(2.5, 1.5, n),
        'num_h_donors': np.random.randint(0, 6, n),
        'num_h_acceptors': np.random.randint(1, 12, n),
        'num_rotatable_bonds': np.random.randint(0, 10, n),
        'tpsa': np.random.normal(70, 25, n),
        'num_rings': np.random.randint(0, 6, n),
        'protein_length': np.random.randint(150, 800, n),
        'num_basic': np.random.randint(8, 45, n),
        'num_acidic': np.random.randint(6, 40, n),
        'affinity': np.random.uniform(4.5, 9.0, n)
    }
    df = pd.DataFrame(data)
    df.to_csv('data/processed/final_processed_features.csv', index=False)
    print(f"✅ Created dummy dataset with {n} samples")

# ====================== Prediction ======================
def predict_binding(smiles, fasta):
    if not os.path.exists(MODEL_PATH):
        print("⚠️ Model not found → Training...")
        train_xgboost()
    
    model = joblib.load(MODEL_PATH)
    
    drug_feat = extract_drug_features(smiles)
    if not drug_feat:
        raise ValueError("Invalid SMILES string")
    
    prot_feat = extract_protein_features(fasta)
    
    input_data = {**drug_feat, **prot_feat}
    input_df = pd.DataFrame([input_data])
    
    affinity_score = model.predict(input_df)[0]
    return round(float(affinity_score), 2)

# ====================== Feature Importance ======================
def get_feature_importance():
    if not os.path.exists(MODEL_PATH):
        train_xgboost()
    
    model = joblib.load(MODEL_PATH)
    
    feature_names = [
        'mol_weight', 'logp', 'num_h_donors', 'num_h_acceptors',
        'num_rotatable_bonds', 'tpsa', 'num_rings',
        'protein_length', 'num_basic', 'num_acidic'
    ]
    
    importances = model.feature_importances_
    importance_list = sorted([
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in zip(feature_names, importances)
    ], key=lambda x: x["importance"], reverse=True)
    
    return importance_list

if __name__ == "__main__":
    train_xgboost()