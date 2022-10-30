<template>
	<transition-group name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="false" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="[]" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement" key="panneau">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="$parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-retroaction">
				<div class="contenu inactif">
					<div class="retroactions">
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('applaudissements', 'confettis')">🎉</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('applaudissements', 'applaudissements')">👏</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('victoire', 'victoire')">🏆</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('dommage', 'dommage')">🙁</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('vrai', 'vrai')">✅</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('faux', 'faux')">❎</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('vrai', 'pouce-haut')">👍</span>
						<span class="bouton" role="button" tabindex="0" @click="ouvrirCarte('faux', 'pouce-bas')">👎</span>
					</div>
					<label>{{ $t('activerEffetsSonores') }}</label>
					<div class="choix">
						<span class="oui">
							<input type="radio" :id="'son_oui_' + id" :name="'son_oui_' + id" value="oui" :checked="son === 'oui'" @change="son = $event.target.value">
							<label :for="'son_oui_' + id">{{ $t('oui') }}</label>
						</span>
						<span class="non">
							<input type="radio" :id="'son_non_' + id" :name="'son_oui_' + id" value="non" :checked="son === 'non'" @change="son = $event.target.value">
							<label :for="'son_non_' + id">{{ $t('non') }}</label>
						</span>
					</div>
				</div>
			</div>
		</vue-drag-resize>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'confettis'}" @click="fermerCarte" key="confettis">
			<span class="carte">🎉</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'applaudissements'}" @click="fermerCarte" key="applaudissements">
			<span class="carte">👏</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'victoire'}" @click="fermerCarte" key="victoire">
			<span class="carte">🏆</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'dommage'}" @click="fermerCarte" key="dommage">
			<span class="carte">🙁</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'vrai'}" @click="fermerCarte" key="vrai">
			<span class="carte">✅</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'faux'}" @click="fermerCarte" key="faux">
			<span class="carte">❎</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'pouce-haut'}" @click="fermerCarte" key="pouce-haut">
			<span class="carte">👍</span>
		</div>

		<div class="conteneur-carte" :class="{'ouvert': carte === 'pouce-bas'}" @click="fermerCarte" key="pouce-bas">
			<span class="carte">👎</span>
		</div>
	</transition-group>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PRetroaction',
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
			mode: 'lecture',
			deplacement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 22,
			minh: 18,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			carte: '',
			audio: '',
			son: 'oui'
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { son: this.son }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
			}
		},
		finRedimensionnement: function () {
			this.positionner()
		},
		hauteurPage: function () {
			this.positionner()
		}
	},
	created () {
		this.titre = this.$t('retroaction')
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
		if (this.panneau.mode !== '') {
			this.mode = this.panneau.mode
		}
		if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		if (this.panneau.contenu !== '') {
			this.son = this.panneau.contenu.son
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		ouvrirCarte (audio, carte) {
			this.carte = carte
			if (this.son === 'oui') {
				this.audio = document.querySelector('#audio-' + audio)
				this.$lireAudio(this.audio)
			}
			if (carte === 'confettis' || carte === 'applaudissements' || carte === 'victoire') {
				this.$lancerConfettis()
			}
		},
		fermerCarte () {
			this.carte = ''
			if (this.audio !== '') {
				this.audio.pause()
			}
			this.audio = ''
		}
	}
}
</script>

<style>
.panneau .panneau-retroaction .retroactions {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	margin-bottom: 2rem;
}

.panneau .panneau-retroaction .bouton {
	font-size: 3rem;
	background: #fff;
	height: 7rem;
	width: 7rem;
	padding: 0;
	text-align: center;
	line-height: 7rem;
	border: 2px solid #00ced1;
	border-radius: 50%;
	letter-spacing: 0;
	text-indent: 0;
}

.panneau .panneau-retroaction .bouton:hover {
	border: 2px solid #00acb0;
	background: #00ced1;
}

.panneau .panneau-retroaction .oui {
	margin-right: 2.5rem;
}

.panneau .panneau-retroaction .choix label {
	display: inline-block;
    width: auto;
    margin-left: 1rem;
	margin-bottom: 0;
}

.conteneur-carte {
	visibility: hidden;
	display: flex;
	justify-content: center;
	align-items: center;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	height: 100%;
	width: 100%;
	z-index: 10005;
	background-color: rgba(0, 0, 0, 0.5);
	opacity: 0;
	transition: opacity 0.4s ease-in-out;
	cursor: pointer;
}

.conteneur-carte.ouvert {
	visibility: visible;
	opacity: 1;
}

.carte {
	font-size: 50vh;
	color: #fff;
	transform: scale(0);
	transition: all 0.4s ease-in-out;
	user-select: none;
	text-shadow: 3px 3px 3px rgba(0, 0, 0, 0.3);
}

.conteneur-carte.ouvert .carte {
	transform: scale(1);
}
</style>
