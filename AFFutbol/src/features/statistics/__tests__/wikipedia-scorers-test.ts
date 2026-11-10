import { parseTopScorers } from '../../../../supabase/functions/_shared/wikipedia-scorers';

/**
 * Real wikitext copied from the 2026–27 season articles. They are the reason
 * the parser exists: tied positions share a `rowspan` cell, the Premier League
 * table also shares a club between two scorers, and every cell carries a flag
 * template or a piped link.
 */
const LALIGA_WIKITEXT = `===Top goalscorers===
{| class="wikitable" style="text-align:center;white-space:nowrap"
!Rank
!Player
!Club
!Goals<ref>{{cite web |title=La Liga Stats – Scorers |url=https://www.laliga.com/en-GB/stats/laliga-easports/scorers |publisher=La Liga |access-date=7 November 2026 }}</ref>
|-
|1
|align="left"|{{#invoke:flag|icon|BRA}} [[Raphinha]]
|align="left"|Barcelona
|15
|-
|2
|align="left"|{{#invoke:flag|icon|FRA}} [[Kylian Mbappé]]
|align="left"|Real Madrid
|13
|-
|3
|align="left"|{{#invoke:flag|icon|ESP}} [[Lamine Yamal]]
|align="left"|Barcelona
|10
|-
|4
|align="left"|{{#invoke:flag|icon|MAR}} [[Yassir Zabiri]]
|align="left"|Racing Santander
|9
|-
|5
|align="left"|{{#invoke:flag|icon|CRO}} [[Ante Budimir]]
|align="left"|Osasuna
|8
|-
|rowspan="2"|6
|align="left"|{{#invoke:flag|icon|ESP}} [[Sergio Camello]]
|align="left"|Rayo Vallecano
|rowspan="2"|7
|-
|align="left"|{{#invoke:flag|icon|ESP}} [[Fermín López]]
|align="left"|Barcelona
|-
|rowspan="2"|8
|align="left"|{{#invoke:flag|icon|ESP}} [[Roberto Fernández (footballer, born 2002)|Roberto Fernández]]
|align="left"|Espanyol
|rowspan="2"|6
|-
|align="left"|{{#invoke:flag|icon|ESP}} [[Fer Niño]]
|align="left"|Elche
|-
|rowspan="5"|10
|align="left"|{{#invoke:flag|icon|GAB}} [[Pierre-Emerick Aubameyang]]
|align="left"|Deportivo A Coruña
|rowspan="5"|5
|-
|align="left"|{{#invoke:flag|icon|ESP}} [[Álex Baena]]
|align="left"|{{nobreak|Atlético Madrid}}
|-
|align="left"|{{#invoke:flag|icon|ARG}} [[Lucas Boyé]]
|align="left"|Alavés
|-
|align="left"|{{#invoke:flag|icon|ESP}} [[Roger Brugué]]
|align="left"|Levante
|-
|align="left"|{{#invoke:flag|icon|ESP}} [[Adrián Niño]]
|align="left"|Málaga
|}`;

const PREMIER_WIKITEXT = `===Top scorers===
{| class="wikitable" style="text-align:center"
|-
! Rank
! Player
! Club
! Goals<ref>{{#invoke:cite|web|title=Premier League Top Player Stats – Goals|url=https://www.premierleague.com/en/stats/top/players/goals/2026-27}}</ref>
|-
| 1
| align="left" | {{#invoke:flag|icon|NOR}} [[Erling Haaland]]
| align="left" | Manchester City
| 9
|-
| 2
| align="left" | {{#invoke:flag|icon|SWE}} [[Alexander Isak]]
| align="left" | Liverpool
| 7
|-
| rowspan="2" | 3
| align="left" | {{#invoke:flag|icon|FRA}} [[Thierno Barry (footballer, born 2002)|Thierno Barry]]
| align="left" | Everton
| rowspan="2" | 6
|-
| align="left" | {{#invoke:flag|icon|SEN}} [[Nicolas Jackson]]
| align="left" | Aston Villa
|-
| rowspan="5" | 5
| align="left" | {{#invoke:flag|icon|FRA}} [[Rayan Cherki]]
| align="left" | Manchester City
| rowspan="5" | 5
|-
| align="left" | {{#invoke:flag|icon|BRA}} [[Evanilson (footballer, born 1999)|Evanilson]]
| align="left" | Bournemouth
|-
| align="left" | {{#invoke:flag|icon|BRA}} [[João Pedro (footballer, born 2001)|João Pedro]]
| align="left" rowspan="2" | Chelsea
|-
| align="left" | {{#invoke:flag|icon|ENG}} [[Morgan Rogers]]
|-
| align="left" | {{#invoke:flag|icon|ENG}} [[Marcus Tavernier]]
| align="left" | Bournemouth
|-
| rowspan="4" | 10
| align="left" | {{#invoke:flag|icon|ENG}} [[Dominic Calvert-Lewin]]
| align="left" | Leeds United
| rowspan="4" | 4
|-
| align="left" | {{#invoke:flag|icon|POR}} [[Bruno Fernandes]]
| align="left" | Manchester United
|-
| align="left" | {{#invoke:flag|icon|GER}} [[Pascal Groß]]
| align="left" | Brighton & Hove Albion
|-
| align="left" | {{#invoke:flag|icon|CMR}} [[Bryan Mbeumo]]
| align="left" | Manchester United
|}`;

describe('parseTopScorers', () => {
  it('reads the LaLiga table and resolves links and templates', () => {
    const scorers = parseTopScorers(LALIGA_WIKITEXT);

    expect(scorers).toHaveLength(14);
    expect(scorers[0]).toEqual({
      player: 'Raphinha',
      team: { name: 'Barcelona' },
      goals: 15,
    });
    expect(scorers[2]).toEqual({
      player: 'Lamine Yamal',
      team: { name: 'Barcelona' },
      goals: 10,
    });
    expect(scorers[7]).toEqual({
      player: 'Roberto Fernández',
      team: { name: 'Espanyol' },
      goals: 6,
    });
    expect(scorers[10]).toEqual({
      player: 'Álex Baena',
      team: { name: 'Atlético Madrid' },
      goals: 5,
    });
  });

  it('carries a tied goals cell over the rowspan rows', () => {
    const scorers = parseTopScorers(LALIGA_WIKITEXT);
    const byPlayer = new Map(scorers.map((scorer) => [scorer.player, scorer]));

    expect(byPlayer.get('Sergio Camello')?.goals).toBe(7);
    expect(byPlayer.get('Fermín López')?.goals).toBe(7);
    expect(byPlayer.get('Fer Niño')?.goals).toBe(6);
    expect(byPlayer.get('Pierre-Emerick Aubameyang')?.goals).toBe(5);
    expect(byPlayer.get('Adrián Niño')?.goals).toBe(5);
    expect(byPlayer.get('Adrián Niño')?.team.name).toBe('Málaga');
  });

  it('carries a shared club cell (Premier League) and the "Top scorers" heading', () => {
    const scorers = parseTopScorers(PREMIER_WIKITEXT);

    expect(scorers).toHaveLength(13);
    expect(scorers[0]).toEqual({
      player: 'Erling Haaland',
      team: { name: 'Manchester City' },
      goals: 9,
    });

    const byPlayer = new Map(scorers.map((scorer) => [scorer.player, scorer]));
    expect(byPlayer.get('João Pedro')?.team.name).toBe('Chelsea');
    expect(byPlayer.get('Morgan Rogers')).toEqual({
      player: 'Morgan Rogers',
      team: { name: 'Chelsea' },
      goals: 5,
    });
    expect(byPlayer.get('Marcus Tavernier')?.team.name).toBe('Bournemouth');
    expect(byPlayer.get('Nicolas Jackson')?.goals).toBe(6);
  });

  it('respects the row cap', () => {
    expect(parseTopScorers(LALIGA_WIKITEXT, 3)).toHaveLength(3);
  });

  it('returns nothing when the article has no scorer section', () => {
    expect(parseTopScorers('===League table===\n{| class="wikitable"\n|}')).toEqual([]);
  });

  it('returns nothing when the heading has no table after it', () => {
    expect(parseTopScorers('===Top goalscorers===\nNo table here.')).toEqual([]);
  });
});
