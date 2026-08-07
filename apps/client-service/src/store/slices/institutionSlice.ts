import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InstitutionSummary {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  role?: string;
}

interface InstitutionState {
  activeInstitution: InstitutionSummary | null;
  userInstitutions: InstitutionSummary[];
}

const initialState: InstitutionState = {
  activeInstitution: null,
  userInstitutions: [],
};

export const institutionSlice = createSlice({
  name: 'institution',
  initialState,
  reducers: {
    setActiveInstitution: (state, action: PayloadAction<InstitutionSummary | null>) => {
      state.activeInstitution = action.payload;
    },
    setUserInstitutions: (state, action: PayloadAction<InstitutionSummary[]>) => {
      state.userInstitutions = action.payload;
      if (!state.activeInstitution && action.payload.length > 0) {
        state.activeInstitution = action.payload[0];
      }
    },
  },
});

export const { setActiveInstitution, setUserInstitutions } = institutionSlice.actions;
export default institutionSlice.reducer;
