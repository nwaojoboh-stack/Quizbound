import type { Question } from '@quiz/shared'

// Seed-Fragenbank (Deutsch). Der Moderator kann live weitere Fragen ergaenzen.
export const SEED_QUESTIONS: Question[] = [
  // Geografie
  { id: 'geo1', category: 'Geografie', difficulty: 'easy', text: 'Wie heisst die Hauptstadt von Frankreich?', answer: 'Paris' },
  { id: 'geo2', category: 'Geografie', difficulty: 'medium', text: 'Welcher ist der laengste Fluss der Welt?', answer: 'Der Nil (bzw. Amazonas)' },
  { id: 'geo3', category: 'Geografie', difficulty: 'hard', text: 'Wie heisst die Hauptstadt von Australien?', answer: 'Canberra' },
  { id: 'geo4', category: 'Geografie', difficulty: 'extreme', text: 'Welches Land hat die meisten Zeitzonen (inkl. Ueberseegebiete)?', answer: 'Frankreich (12 Zeitzonen)' },

  // Geschichte
  { id: 'his1', category: 'Geschichte', difficulty: 'easy', text: 'In welchem Jahr fiel die Berliner Mauer?', answer: '1989' },
  { id: 'his2', category: 'Geschichte', difficulty: 'medium', text: 'Wer war der erste Bundeskanzler der Bundesrepublik Deutschland?', answer: 'Konrad Adenauer' },
  { id: 'his3', category: 'Geschichte', difficulty: 'hard', text: 'In welchem Jahr begann der Dreissigjaehrige Krieg?', answer: '1618' },
  { id: 'his4', category: 'Geschichte', difficulty: 'extreme', text: 'Wie hiess der roemische Kaiser, der das Mailaender Edikt 313 erliess?', answer: 'Konstantin der Grosse' },

  // Wissenschaft
  { id: 'sci1', category: 'Wissenschaft', difficulty: 'easy', text: 'Welches chemische Element hat das Symbol O?', answer: 'Sauerstoff' },
  { id: 'sci2', category: 'Wissenschaft', difficulty: 'medium', text: 'Wie viele Planeten hat unser Sonnensystem?', answer: 'Acht' },
  { id: 'sci3', category: 'Wissenschaft', difficulty: 'hard', text: 'Wie heisst das Phaenomen, bei dem Licht an einer Kante abgelenkt wird?', answer: 'Beugung (Diffraktion)' },
  { id: 'sci4', category: 'Wissenschaft', difficulty: 'extreme', text: 'Wie lautet die Plancksche Konstante (gerundet, in Js)?', answer: '6,626 x 10^-34 Js' },

  // Sport
  { id: 'spo1', category: 'Sport', difficulty: 'easy', text: 'Wie viele Spieler stehen bei einer Fussballmannschaft auf dem Feld?', answer: 'Elf' },
  { id: 'spo2', category: 'Sport', difficulty: 'medium', text: 'In welcher Stadt fanden die Olympischen Sommerspiele 2021 statt?', answer: 'Tokio' },
  { id: 'spo3', category: 'Sport', difficulty: 'hard', text: 'Wie oft wurde Michael Schumacher Formel-1-Weltmeister?', answer: 'Sieben Mal' },
  { id: 'spo4', category: 'Sport', difficulty: 'extreme', text: 'Wer hielt vor Usain Bolt den 100-Meter-Weltrekord (9,74 s, 2007)?', answer: 'Asafa Powell' },

  // Musik
  { id: 'mus1', category: 'Musik', difficulty: 'easy', text: 'Wie viele Saiten hat eine Standard-Gitarre?', answer: 'Sechs' },
  { id: 'mus2', category: 'Musik', difficulty: 'medium', text: 'Welche Band veroeffentlichte das Album "Abbey Road"?', answer: 'The Beatles' },
  { id: 'mus3', category: 'Musik', difficulty: 'hard', text: 'Wer komponierte die Oper "Die Zauberfloete"?', answer: 'Wolfgang Amadeus Mozart' },
  { id: 'mus4', category: 'Musik', difficulty: 'extreme', text: 'In welcher Tonart steht Beethovens 5. Sinfonie?', answer: 'c-Moll' },

  // Film & TV
  { id: 'fil1', category: 'Film & TV', difficulty: 'easy', text: 'Wie heisst der Zauberlehrling aus J.K. Rowlings Buchreihe?', answer: 'Harry Potter' },
  { id: 'fil2', category: 'Film & TV', difficulty: 'medium', text: 'Wer spielte die Hauptrolle in "Forrest Gump"?', answer: 'Tom Hanks' },
  { id: 'fil3', category: 'Film & TV', difficulty: 'hard', text: 'Welcher Film gewann 2020 den Oscar als bester Film?', answer: 'Parasite' },
  { id: 'fil4', category: 'Film & TV', difficulty: 'extreme', text: 'Wie hiess der Regisseur des Films "Metropolis" (1927)?', answer: 'Fritz Lang' },

  // Natur
  { id: 'nat1', category: 'Natur', difficulty: 'easy', text: 'Welches ist das groesste Landtier der Welt?', answer: 'Der Afrikanische Elefant' },
  { id: 'nat2', category: 'Natur', difficulty: 'medium', text: 'Wie nennt man die Wissenschaft von den Pilzen?', answer: 'Mykologie' },
  { id: 'nat3', category: 'Natur', difficulty: 'hard', text: 'Wie viele Herzen hat ein Tintenfisch (Oktopus)?', answer: 'Drei' },
  { id: 'nat4', category: 'Natur', difficulty: 'extreme', text: 'Wie heisst der einzige Saeugetier-Stamm, der Eier legt?', answer: 'Kloakentiere (Monotremata)' },

  // Kunst & Kultur
  { id: 'art1', category: 'Kunst', difficulty: 'easy', text: 'Wer malte die "Mona Lisa"?', answer: 'Leonardo da Vinci' },
  { id: 'art2', category: 'Kunst', difficulty: 'medium', text: 'In welchem Museum haengt die "Mona Lisa"?', answer: 'Im Louvre (Paris)' },
  { id: 'art3', category: 'Kunst', difficulty: 'hard', text: 'Welcher Kuenstler schnitt sich einen Teil seines Ohrs ab?', answer: 'Vincent van Gogh' },
  { id: 'art4', category: 'Kunst', difficulty: 'extreme', text: 'Wie heisst die Kunstrichtung, die Salvador Dali praegte?', answer: 'Surrealismus' },
]
