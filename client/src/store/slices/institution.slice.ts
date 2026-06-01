import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Institution, InstitutionType } from "@/types/institution";
import { MOCK_INSTITUTIONS } from "@/lib/mock-data/institutions";

interface InstitutionState {
  selectedInstitutionId: string | null;
  selectedInstitution: Institution | null;
  userInstitutions: Institution[];
}

const initialState: InstitutionState = {
  // Pre-select Design Institute for studio dev
  selectedInstitutionId: "inst-3",
  selectedInstitution: MOCK_INSTITUTIONS.find((i) => i.id === "inst-3") ?? null,
  userInstitutions: MOCK_INSTITUTIONS.filter((i) => ["inst-3"].includes(i.id)),
};

const institutionSlice = createSlice({
  name: "institution",
  initialState,
  reducers: {
    selectInstitution(state, action: PayloadAction<string>) {
      const institution = MOCK_INSTITUTIONS.find((i) => i.id === action.payload);
      state.selectedInstitutionId = action.payload;
      state.selectedInstitution = institution ?? null;
    },
    setUserInstitutions(state, action: PayloadAction<Institution[]>) {
      state.userInstitutions = action.payload;
    },
    updateInstitutionType(state, action: PayloadAction<InstitutionType>) {
      if (state.selectedInstitution) {
        state.selectedInstitution.institutionType = action.payload;
      }
      state.userInstitutions = state.userInstitutions.map((inst) =>
        inst.id === state.selectedInstitutionId
          ? { ...inst, institutionType: action.payload }
          : inst
      );
    },
  },
});

export const { selectInstitution, setUserInstitutions, updateInstitutionType } = institutionSlice.actions;
export default institutionSlice.reducer;
