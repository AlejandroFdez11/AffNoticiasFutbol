import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_IDS,
  LEGAL_PUBLIC_PATHS,
  getLegalDocument,
  legalPublicUrl,
} from '../documents';

describe('legal documents', () => {
  it('has one entry per id', () => {
    expect(Object.keys(LEGAL_DOCUMENTS).sort()).toEqual([...LEGAL_DOCUMENT_IDS].sort());
  });

  it('exposes stable public URLs for the stores', () => {
    expect(legalPublicUrl('privacidad')).toBe('https://affnoticiasweb.netlify.app/legal/privacidad');
    expect(legalPublicUrl('terminos')).toBe('https://affnoticiasweb.netlify.app/legal/terminos');
    expect(legalPublicUrl('fuentes')).toBe('https://affnoticiasweb.netlify.app/legal/fuentes');
    expect(LEGAL_PUBLIC_PATHS.fuentes).toBe('/legal/fuentes');
  });

  it('renders real content in every document', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      const document = getLegalDocument(id);

      expect(document.title.length).toBeGreaterThan(0);
      expect(document.summary.length).toBeGreaterThan(0);
      expect(document.blocks.length).toBeGreaterThan(10);
      expect(document.blocks.some((block) => block.kind === 'heading')).toBe(true);
      expect(document.blocks.some((block) => block.kind === 'paragraph')).toBe(true);
    }
  });

  it('covers deletion, retention and rights in the privacy policy', () => {
    const text = JSON.stringify(LEGAL_DOCUMENTS.privacidad);

    expect(text).toContain('Eliminar cuenta');
    expect(text).toContain('Copias de seguridad');
    expect(text).toContain('no incluye copias automáticas');
    expect(text).toContain('AEPD');
    expect(text).toContain(LEGAL_CONTACT_EMAIL);
  });

  it('credits every data source', () => {
    const text = JSON.stringify(LEGAL_DOCUMENTS.fuentes);

    expect(text).toContain('API-Football');
    expect(text).toContain('football-data.org');
    expect(text).toContain('Wikipedia');
    expect(text).toContain('Marca');
    expect(text).toContain('Mundo Deportivo');
    expect(text).toContain('Relevo');
    expect(text).toContain('20minutos');
    expect(text).toContain('La Vanguardia');
    expect(text).toContain('ESPN');
  });

  it('states the scoring rules used by the backend', () => {
    const text = JSON.stringify(LEGAL_DOCUMENTS.terminos);

    expect(text).toContain('10 puntos');
    expect(text).toContain('5 puntos');
  });
});
