import os
import sys
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.services.ml_engine import ml_engine

# The 50 samples from ml_engine._train_model
X = np.array([
    # age, employment_months, monthly_income, credit_score, existing_emi, dependents, loan_amount, tenure
    [25, 12, 30000, 650, 5000, 1, 200000, 24],   # Approved
    [35, 60, 75000, 750, 10000, 2, 500000, 60],  # Approved
    [45, 120, 100000, 800, 15000, 3, 1000000, 120],  # Approved
    [28, 24, 45000, 700, 8000, 2, 300000, 36],   # Approved
    [22, 6, 25000, 600, 0, 0, 150000, 24],       # Rejected (low income)
    [50, 180, 120000, 850, 20000, 4, 800000, 120],  # Approved
    [30, 36, 55000, 720, 12000, 2, 400000, 48],  # Approved
    [26, 18, 35000, 680, 6000, 1, 250000, 30],   # Approved
    [40, 96, 90000, 780, 14000, 3, 600000, 84],  # Approved
    [29, 30, 50000, 710, 9000, 2, 350000, 42],   # Approved
    [21, 3, 20000, 550, 0, 0, 100000, 18],       # Rejected (too young, low income)
    [55, 200, 130000, 820, 25000, 5, 700000, 120],  # Approved
    [32, 48, 65000, 740, 11000, 2, 450000, 54],  # Approved
    [27, 24, 40000, 695, 7000, 1, 280000, 36],   # Approved
    [38, 72, 85000, 770, 13000, 3, 550000, 72],  # Approved
    [24, 12, 32000, 670, 4000, 1, 180000, 24],   # Approved
    [43, 120, 110000, 800, 18000, 4, 750000, 108],  # Approved
    [31, 42, 60000, 730, 10000, 2, 380000, 48],  # Approved
    [28, 30, 48000, 715, 8500, 1, 320000, 36],   # Approved
    [36, 60, 78000, 760, 12500, 3, 500000, 60],  # Approved
    [23, 8, 28000, 640, 3000, 0, 160000, 24],    # Rejected (income too low for amount)
    [48, 144, 125000, 810, 22000, 4, 850000, 120],  # Approved
    [33, 48, 62000, 725, 9500, 2, 400000, 48],   # Approved
    [26, 20, 38000, 690, 5500, 1, 240000, 30],   # Approved
    [41, 96, 95000, 785, 15000, 3, 600000, 72],  # Approved
    [30, 36, 52000, 705, 8200, 2, 340000, 42],   # Approved
    [25, 15, 34000, 675, 4500, 1, 200000, 28],   # Approved
    [44, 132, 115000, 795, 19000, 3, 750000, 108],  # Approved
    [29, 32, 56000, 735, 9800, 2, 380000, 45],   # Approved
    [37, 66, 82000, 765, 13200, 3, 520000, 66],  # Approved
    [20, 2, 18000, 580, 0, 0, 80000, 18],        # Rejected (too young, low income)
    [52, 216, 135000, 830, 26000, 5, 900000, 132],  # Approved
    [34, 54, 68000, 745, 10800, 2, 420000, 54],  # Approved
    [27, 25, 42000, 705, 7000, 1, 260000, 32],   # Approved
    [39, 78, 88000, 775, 14000, 3, 560000, 72],  # Approved
    [28, 28, 46000, 720, 8500, 2, 310000, 38],   # Approved
    [24, 10, 30000, 660, 3500, 0, 170000, 24],   # Rejected (low income)
    [46, 150, 120000, 805, 21000, 4, 800000, 120],  # Approved
    [32, 44, 61000, 735, 10200, 2, 390000, 48],  # Approved
    [25, 18, 36000, 685, 5000, 1, 220000, 28],   # Approved
    [40, 84, 92000, 790, 15000, 3, 580000, 72],  # Approved
    [30, 40, 54000, 715, 9200, 2, 360000, 42],   # Approved
    [26, 22, 40000, 700, 6000, 1, 250000, 30],   # Approved
    [45, 138, 118000, 815, 20000, 4, 780000, 120],  # Approved
    [33, 50, 66000, 750, 11000, 2, 410000, 50],  # Approved
    [28, 26, 44000, 710, 7500, 1, 280000, 34],   # Approved
    [38, 72, 86000, 770, 13500, 3, 540000, 66],  # Approved
    [29, 34, 50000, 725, 9000, 2, 330000, 40],   # Approved
    [22, 5, 22000, 600, 0, 0, 120000, 20],       # Rejected (too young, low income)
    [35, 72, 80000, 760, 12000, 2, 450000, 60],  # Approved (50th sample)
])

# Labels: 1 = Approved, 0 = Rejected
y = np.array([
    1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
])

X_scaled = ml_engine.scaler.transform(X)
y_pred = ml_engine.model.predict(X_scaled)
y_prob = ml_engine.model.predict_proba(X_scaled)[:, 1]

acc = accuracy_score(y, y_pred)
prec = precision_score(y, y_pred)
rec = recall_score(y, y_pred)
f1 = f1_score(y, y_pred)
auc = roc_auc_score(y, y_prob)
cm = confusion_matrix(y, y_pred)

print(f"Total Samples: {len(y)}")
print(f"Approved (Class 1): {np.sum(y == 1)}, Rejected (Class 0): {np.sum(y == 0)}")
print(f"Accuracy: {acc * 100:.2f}%")
print(f"Precision: {prec * 100:.2f}%")
print(f"Recall: {rec * 100:.2f}%")
print(f"F1-Score: {f1 * 100:.2f}%")
print(f"ROC-AUC: {auc:.4f}")
print("Confusion Matrix (TN, FP / FN, TP):")
print(cm)
print("\nClassification Report:")
print(classification_report(y, y_pred, target_names=["Rejected (0)", "Approved (1)"]))

