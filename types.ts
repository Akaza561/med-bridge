
export interface MedicineDetails {
  medicineName: string;
  expiryDate: string;
  dosage: string;
  imageUrls: string[];
}

export interface AnalysisResult {
  data: MedicineDetails | null;
  error: string | null;
  loading: boolean;
}
