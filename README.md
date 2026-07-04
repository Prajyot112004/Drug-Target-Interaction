# 🧬 DrugTarget AI - Drug-Target Interaction Predictor

## 📌 Project Overview

**DrugTarget AI** is a web-based application that predicts the **binding affinity** (pKd) between a drug molecule and a target protein using **Machine Learning**.

It allows researchers and students to quickly screen potential drug candidates by inputting a drug's SMILES string and a protein's FASTA sequence.

---

## 🎯 Objectives

- Predict binding affinity (pKd) between drugs and proteins
- Provide an easy-to-use web interface
- Show model interpretability through feature importance
- Display model performance with interactive charts

---

## ⚡ Key Features

- **Web Interface** (HTML + CSS + JavaScript)
- **Backend**: Flask API
- **Model**: XGBoost Regressor
- **Input**: SMILES (Drug) + FASTA (Protein)
- **Output**: Binding affinity score + interpretation
- **Evaluation Dashboard** with real metrics and charts
- File upload support for SMILES & FASTA

---

## 📂 Project Structure

```bash
Drug-Target-Interaction/
├── backend/
│   ├── pycache/
│   ├── app.py                 # Flask backend
│   └── model.py               # Feature extraction + XGBoost model      
├── frontend/
│   ├── index.html             # Main predictor page
│   ├── evaluation.html        # Model evaluation dashboard
│   ├── script.js
│   ├── evaluation.js
│   ├── style.css
│   └── api_docs.html
├── data/
│   ├── processed/
│   │    ├── final_processed_features.csv
│   │    ├── processed_davis.csv
│   │    └── merged_davis_kiba_normalized.csv
│   └── raw/
│        ├── davis_all.csv
│        └── kiba_all.csv
├── models/
│   └── saved/
│       ├── dti_random_forest.pkl
│       ├── dti_xgboost_normalized.pkl
│       └── dti_xgboost_final.pkl
├── notebooks/
│   └── 01_DTI_Model_Development.ipynb
├── utils/
│   ├── data_preprocessing.py
├── results/
│   ├── figures/
│   └── metrics/
├── myenv/
├── requirements.txt
├── .gitignore
└── README.md