import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, isDevMode, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PERSOS } from '../../public/persos';
import { DECK } from '../../public/deck';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('SocialChaos');
  constructor(private http: HttpClient) {}

  link = 'https://chiyanh.cluster031.hosting.ovh.net/';
  persos = PERSOS;
  deck = DECK;
  data: any;
  joueur = '';
  admin = false;
  popup: any;
  pioche = false;

  carte: any;

  symboleMap: Record<string, string> = {
    pique: '♠',
    coeur: '♥',
    trefle: '♣',
    carreau: '♦',
  };

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('joueur')) this.joueur = params.get('joueur')!;
    if (this.joueur == 'Arma') {
      this.admin = true;
      this.joueur = 'Charles';
    }
    this.loadSiteData();
  }

  connect() {
    const params = new URLSearchParams(location.search);
    params.set('joueur', this.joueur);
    location.search = params.toString();
  }

  hasParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('joueur');
  }

  goToSite() {
    window.location.href = this.link + 'getchaos.php';
  }

  isRed(): boolean {
    return this.carte.couleur === 'coeur' || this.carte.couleur === 'carreau';
  }

  symbole(): string {
    return this.symboleMap[this.carte.couleur];
  }

  displayNumero(): string {
    // accepte chiffres ou strings déjà fournis
    const raw = this.carte.numero;
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (this.carte.couleur == 'joker') return 'J';
    if (!Number.isNaN(n)) {
      if (n === 1) return 'A';
      if (n === 11) return 'V';
      if (n === 12) return 'D';
      if (n === 13) return 'R';
      return String(n);
    }
    // si ce n'est pas un nombre, retourne la valeur telle quelle (ex: 'J', 'Q', 'K' ou 'V' déjà)
    return String(raw);
  }

  genererDeck() {
    this.data.game.deck = this.melangerDeck(this.deck);
  }

  melangerDeck(deck: any[]): any[] {
    const copie = [...deck]; // évite de modifier l’original

    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // index aléatoire
      [copie[i], copie[j]] = [copie[j], copie[i]]; // swap
    }

    return copie;
  }

  joueurDuTour() {
    return this.data.joueurs.find((j: any) => j.nom == this.data.game.tour);
  }

  piocher() {
    this.pioche = true;
    let joueur = this.joueurDuTour();
    this.carte = this.data.game.deck.shift();
    if (!joueur.deck) joueur.deck = [];
    joueur.deck.push(this.carte);
  }

  declencherEffetSupplementaire() {
    const joueurs = this.data.joueurs;
    const joueurActuel = joueurs.find((j: any) => j.nom === this.data.game.tour);

    const tirage = Math.random() * 100; // entre 0 et 100

    console.log(tirage);

    // --- 1. 10% gorgée générale ---
    if (tirage < 10) {
      this.popup = { id: 'validate', title: 'Tout le monde boit une gorgée.' };
      this.data.joueurs.forEach((j: any) => {
        if (!j.gorgees) j.gorgees = 1;
        else j.gorgees = j.gorgees + 1;
      });
      return;
    }

    // --- 2. 1% cul sec pour un joueur aléatoire ---
    if (tirage < 11) {
      const random = joueurs[Math.floor(Math.random() * joueurs.length)];
      this.popup = { id: 'validate', title: `${random.nom} prend un cul sec !` };
      if (!random.culsec) random.culsec = 1;
      else random.culsec = random.culsec + 1;
      return;
    }
    if (tirage < 12) {
      const random = joueurs[Math.floor(Math.random() * joueurs.length)];
      this.popup = { id: 'validate', title: `${joueurActuel.nom} prend un cul sec !` };
      if (!joueurActuel.culsec) joueurActuel.culsec = 1;
      else joueurActuel.culsec = joueurActuel.culsec + 1;
      return;
    }

    // --- 3. 50% gorgée pour le joueur actuel ---
    if (tirage < 61) {
      // 10 + 1 + 50 = 61
      joueurActuel.gorgees++;
      this.popup = { id: 'validate', title: `${joueurActuel.nom} boit une gorgée` };
      if (!joueurActuel.gorgees) joueurActuel.gorgees = 1;
      else joueurActuel.gorgees = joueurActuel.gorgees + 1;
      return;
    }

    // --- 4. Le reste des probabilités : gorgée pondérée ---
    // Calcul du poids inverse selon les gorgées
    const candidats = joueurs.filter((j: any) => j.nom != this.joueur);
    const poids = candidats.map((j: any) => 1 / ((j.gorgees ? j.gorgees : 0) + 1));

    const total = poids.reduce((a: any, b: any) => a + b, 0);
    let r = Math.random() * total;

    let selection = null;
    for (let i = 0; i < candidats.length; i++) {
      r -= poids[i];
      if (r <= 0) {
        selection = candidats[i];
        break;
      }
    }

    if (selection) {
      if (!selection.gorgees) selection.gorgees = 1;
      else selection.gorgees = selection.gorgees + 1;
      this.popup = { id: 'validate', title: `${selection.nom} reçoit une gorgée gratuite.` };
    } else {
      this.popup = { id: 'validate', title: `Tour sans pénalité !` };
    }
  }

  joueurProp() {
    return Object.keys(this.data.joueurs[0]);
  }

  addPlayer() {
    this.popup = { title: 'Ajouter joueur', id: 'addplayer', txt: true, model: '' };
  }

  removePlayer() {
    this.popup = { title: 'Supprimer joueur', id: 'deleteplayer', joueurs: true, model: '' };
  }

  terminertour() {
    this.popup = { title: 'Terminer le tour', id: 'endtour' };
  }

  annulerPopup() {
    this.popup = undefined;
  }

  addTournee() {
    this.popup = { title: 'Ajouter une tournée', id: 'addtournee', each: true, model: {} };
  }

  reinitgame() {
    this.popup = { id: 'reinitgame', title: 'Réinitialiser la partie ?' };
  }

  reinitall() {
    this.popup = { id: 'reinitall', title: 'Réinitialiser tout?' };
  }

  reinitgorgees() {
    this.popup = { id: 'reinitgorgees', title: 'Réinitialiser les gorgées ?' };
  }

  reinitboissons() {
    this.popup = { id: 'reinitboissons', title: 'Réinitialiser les boissons ?' };
  }

  reinitsmthg() {
    this.popup = {
      id: 'reinitsmthg',
      title: 'Réinitialiser quelque chose ?',
      smthg: true,
      model: {},
    };
  }

  validatePopup() {
    if (this.popup.id == 'addplayer') {
      this.data.joueurs.push({
        nom: this.popup.model,
        gorgees: 0,
        culsec: 0,
        deck: [],
        boissons: [],
      });
      this.updateData();
    } else if (this.popup.id == 'endtour') {
      this.changeTour();
      this.carte = undefined;
      this.pioche = false;
      this.updateData();
    } else if (this.popup.id == 'reinitgame') {
      this.data.game.deck = undefined;
      this.genererDeck();
      this.data.joueurs.forEach((j: any) => {
        j.deck = [];
      });
      this.updateData();
    } else if (this.popup.id == 'reinitgorgees') {
      this.data.joueurs.forEach((j: any) => {
        j.gorgees = 0;
        j.culsec = 0;
      });
      this.updateData();
    } else if (this.popup.id == 'reinitboissons') {
      this.data.joueurs.forEach((j: any) => {
        j.boissons = [];
      });
      this.updateData();
    } else if (this.popup.id == 'reinitall') {
      this.data.game.deck = undefined;
      this.genererDeck();
      this.data.joueurs.forEach((j: any) => {
        j.gorgees = 0;
        j.culsec = 0;
        j.boissons = [];
        j.deck = [];
      });
      this.updateData();
    } else if (this.popup.id == 'deleteplayer') {
      let joueur = this.data.joueurs.find((j: any) => j.nom == this.popup.model);
      this.data.joueurs.splice(this.data.joueurs.indexOf(joueur), 1);
      if (this.data.game.tour == this.popup.model) {
        this.changeTour();
      }
      this.updateData();
    } else if (this.popup.id == 'addtournee') {
      for (const key of Object.keys(this.popup.model)) {
        const value = this.popup.model[key as keyof typeof this.popup.model];
        let joueur = this.data.joueurs.find((j: any) => j.nom == key);
        joueur.boissons.push(value);
        this.updateData();
      }
    } else if (this.popup.id == 'reinitsmthg') {
      console.log(this.popup.model.key, this.popup.model.value);
      let joueur = this.data.joueurs.find((j: any) => j.nom == this.popup.model.key);
      if (this.popup.model.value == 'gorgees' || this.popup.model.value == 'culsec')
        joueur[this.popup.model.value] = 0;
      else joueur[this.popup.model.value] = [];
      this.updateData();
    }
    this.popup = undefined;
  }

  inTheGame() {
    return this.data.joueurs.find((j: any) => j.nom == this.joueur) != undefined;
  }

  isDevMode() {
    return isDevMode;
  }

  changeTour() {
    const joueurs = this.data.joueurs;
    const actuel = this.data.game.tour;

    const candidats = joueurs.filter((j: any) => j.nom !== actuel);
    const poids = candidats.map((j: any) => 1 / ((j.deck ? j.deck.length : 0) + 1));
    const total = poids.reduce((a: any, b: any) => a + b, 0);

    let tirage = Math.random() * total;

    let selection = null;
    for (let i = 0; i < candidats.length; i++) {
      tirage -= poids[i];
      if (tirage <= 0) {
        selection = candidats[i];
        break;
      }
    }

    // Étape 4 : mise à jour du tour
    if (selection) {
      this.data.game.tour = selection.nom;
    } else {
      // fallback pour éviter aucun résultat
      this.data.game.tour = candidats[0].nom;
    }
  }

  loadSiteData() {
    this.http.get<any>(this.link + 'getchaos.php').subscribe((data) => {
      let action = this.data && this.data.game.tour != this.joueur && data.game.tour == this.joueur;
      this.data = data;
      if (!this.data.game.deck) this.genererDeck();
      if (this.data.joueurs.length == 0)
        this.data.joueurs.push({ nom: 'Charles', gorgees: 0, culsec: 0, deck: [], boissons: [] });
      if (!this.data.game.tour) this.data.game.tour = 'Charles';

      if (action) {
        this.declencherEffetSupplementaire();
      }

      console.log(this.data);
    });
  }

  updateData() {
    this.http
      .post<void>(this.link + 'setchaos', this.data, {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe((data: any) => {
        this.loadSiteData();
      });
  }
}
