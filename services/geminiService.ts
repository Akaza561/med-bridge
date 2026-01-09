
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MedicineDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedicineImage = async (base64Images: string[]): Promise<MedicineDetails> => {
  const model = 'gemini-3-flash-preview';
  
  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: img.split(',')[1] || img,
    },
  }));

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...imageParts,
        {
          text: "Tell me the name, expiry date, and dosage of the medicine shown in these photo(s). Look at all images provided to find the information.",
        },
      ],
    },
    config: {
      systemInstruction: "You are a pharmaceutical data extractor. Analyze the provided images of medicine packaging and return a JSON object with 'medicineName', 'expiryDate', and 'dosage'. If multiple images are provided, combine the information found across all of them. Use 'Not Found' for missing fields.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          medicineName: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
          dosage: { type: Type.STRING },
        },
        required: ["medicineName", "expiryDate", "dosage"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data found");

  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      imageUrls: base64Images
    } as MedicineDetails;
  } catch (err) {
    throw new Error("Could not read medicine data.");
  }
};
