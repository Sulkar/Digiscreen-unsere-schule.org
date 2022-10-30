<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="$parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-dessin">
				<div class="contenu inactif">
					<v-stage ref="dessin" :config="{width: dimensionsCanva.w, height: dimensionsCanva.h}" @mousedown="selectionnerDebut" @touchstart="selectionnerDebut" @mousemove="selectionnerMouvement" @touchmove="selectionnerMouvement" @mouseup="selectionnerFin" @touchend="selectionnerFin">
						<v-layer ref="lignes">
							<v-line v-for="(ligne, indexLigne) in lignes" :config="ligne" :key="'ligne_' + indexLigne" />
						</v-layer>
					</v-stage>

					<div class="outils-dessin">
						<span class="outil noir" :class="{'actif': couleurStylo === '#000000'}" :title="$t('noir')" @click="modifierCouleur('#000000')">
							<span class="couleur noir" />
						</span>
						<span class="outil blanc" :class="{'actif': couleurStylo === '#ffffff'}" :title="$t('blanc')" @click="modifierCouleur('#ffffff')">
							<span class="couleur blanc" />
						</span>
						<span class="outil rouge" :class="{'actif': couleurStylo === '#ff0000'}" :title="$t('rouge')" @click="modifierCouleur('#ff0000')">
							<span class="couleur rouge" />
						</span>
						<span class="outil jaune" :class="{'actif': couleurStylo === '#ffff00'}" :title="$t('jaune')" @click="modifierCouleur('#ffff00')">
							<span class="couleur jaune" />
						</span>
						<span class="outil vert" :class="{'actif': couleurStylo === '#00ff00'}" :title="$t('vert')" @click="modifierCouleur('#00ff00')">
							<span class="couleur vert" />
						</span>
						<span class="outil bleu" :class="{'actif': couleurStylo === '#04fdff'}" :title="$t('bleu')" @click="modifierCouleur('#04fdff')">
							<span class="couleur bleu" />
						</span>
						<span class="separateur" />
						<span class="outil" :title="$t('reinitialiser')" @click="reinitialiser">
							<img src="~@/assets/img/reinitialiser.png" :alt="$t('reinitialiser')">
						</span>
					</div>
				</div>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PDessin',
	components: {
		VueDragResize
	},
	props: {
		panneau: Object,
		largeurPage: Number,
		hauteurPage: Number,
		finRedimensionnement: Boolean,
		zIndex: Number,
		export: Boolean
	},
	extends: Panneau,
	data () {
		return {
			chargement: true,
			mode: 'edition',
			deplacement: false,
			redimensionnement: true,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 48,
			minh: 28,
			statut: '',
			dimensions: {},
			dessin: false,
			ligneId: 0,
			nom: '',
			lignes: [],
			positionStylo: [],
			couleurStylo: '#000000',
			dimensionsCanva: { w: 0, h: 0 }
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { lignes: this.lignes }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
			}
		},
		w: function (largeur) {
			this.dimensionsCanva.w = this.$convertirRem(largeur)
		},
		h: function (hauteur) {
			this.dimensionsCanva.h = this.$convertirRem(hauteur) - this.$convertirRem(3)
		},
		statut: function (valeur) {
			if (valeur === 'max') {
				this.dimensionsCanva.w = this.largeurPage
				this.dimensionsCanva.h = this.hauteurPage - this.$convertirRem(3)
			} else {
				this.dimensionsCanva.w = this.$convertirRem(this.w)
				this.dimensionsCanva.h = this.$convertirRem(this.h) - this.$convertirRem(3)
			}
		},
		finRedimensionnement: function (valeur) {
			if (valeur === true) {
				this.dimensionsCanva.w = this.$convertirRem(this.w)
				this.dimensionsCanva.h = this.$convertirRem(this.h) - this.$convertirRem(3)
			}
			this.positionner()
		},
		hauteurPage: function () {
			this.positionner()
		}
	},
	created () {
		this.titre = this.$t('dessin')
		this.id = this.panneau.id
		this.w = this.panneau.w
		this.h = this.panneau.h
		this.x = this.panneau.x
		this.y = this.panneau.y
		this.z = this.panneau.z
		this.statut = this.panneau.statut
		this.dimensions = this.panneau.dimensions
		if (this.panneau.titre) {
			this.titre = this.panneau.titre
		}
		if (this.panneau.statut === 'max') {
			this.maximiser()
		} else if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		if (this.panneau.contenu !== '') {
			this.lignes = this.panneau.contenu.lignes
		}
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		selectionnerDebut (event) {
			const stage = event.target.getStage()
			this.dessin = true
			this.positionStylo = stage.getPointerPosition()
			this.ligneId++
			this.lignes.push({ name: 'ligne' + this.ligneId, points: [this.positionStylo.x, this.positionStylo.y], globalCompositeOperation: 'source-over', stroke: this.couleurStylo, strokeWidth: 2, draggable: false, verrouille: false })
			this.nom = 'ligne' + this.ligneId
			this.$nextTick(function () {
				this.$refs.lignes.getNode().getLayer().batchDraw()
			}.bind(this))
		},
		selectionnerMouvement (event) {
			const stage = event.target.getStage()
			if (!this.dessin) {
				return
			}
			this.positionStylo = stage.getPointerPosition()
			const item = this.lignes.find(r => r.name === this.nom)
			const points = item.points.concat([this.positionStylo.x, this.positionStylo.y])
			item.points = points
			this.$refs.lignes.getNode().getLayer().batchDraw()
		},
		selectionnerFin () {
			this.dessin = false
		},
		modifierCouleur (couleur) {
			this.couleurStylo = couleur
		},
		reinitialiser () {
			this.ligneId = 0
			this.nom = ''
			this.lignes = []
			this.$refs.lignes.getNode().getLayer().batchDraw()
		}
	}
}
</script>

<style>
.panneau .panneau-dessin {
	padding: 0!important;
}

.panneau .outils-dessin {
	position: absolute;
	top: 0;
	left: 0;
	display: grid;
    grid-template-rows: repeat(20, auto);
    background: transparent;
    padding: 3px 5px;
    margin: 0;
	z-index: 10;
}

.panneau .outils-dessin .outil {
	display: flex;
    align-items: center;
    justify-content: center;
	width: 20px;
    height: 20px;
	margin: 5px 0;
	border-radius: 4px;
    cursor: pointer;
}

.panneau .outils-dessin .outil img {
	width: auto;
	height: auto;
	max-width: 16px;
	max-height: 16px;
	cursor: pointer;
}

.panneau .outils-dessin .separateur {
    margin: 5px 5px;
    border: 1px solid #ddd;
}

.panneau .outils-dessin .outil .couleur {
	display: block;
	width: 20px;
	height: 20px;
	border-radius: 50%;
}

.panneau .outils-dessin .outil.noir.actif,
.panneau .outils-dessin .outil .couleur.noir {
	background: black;
}

.panneau .outils-dessin .outil.blanc.actif,
.panneau .outils-dessin .outil .couleur.blanc {
	background: white;
	border: 1px solid #ddd;
}

.panneau .outils-dessin .outil.blanc.actif .couleur.blanc {
	border: 1px solid transparent;
	width: 18px;
	height: 18px;
}

.panneau .outils-dessin .outil.rouge.actif,
.panneau .outils-dessin .outil .couleur.rouge {
	background: red;
}

.panneau .outils-dessin .outil.jaune.actif,
.panneau .outils-dessin .outil .couleur.jaune {
	background: yellow;
}

.panneau .outils-dessin .outil.vert.actif,
.panneau .outils-dessin .outil .couleur.vert {
	background: #00ff00;
}

.panneau .outils-dessin .outil.bleu.actif,
.panneau .outils-dessin .outil .couleur.bleu {
	background: #04fdff;
}
</style>
