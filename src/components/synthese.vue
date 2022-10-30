<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="false" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="[]" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-synthese">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('texteSynthetiser') }}</label>
					<div class="synthese"><input type="search" :value="texte" @input="texte = $event.target.value"></div>
					<label>{{ $t('vitesse') }}</label>
					<div class="vitesse">
						<input type="range" :min="0.5" :max="2" :value="vitesse" :step="0.1" @change="vitesse = $event.target.value">
						<span class="valeur">{{ vitesse }}</span>
					</div>
					<label>{{ $t('hauteur') }}</label>
					<div class="hauteur">
						<input type="range" :min="0" :max="2" :value="hauteur" :step="0.1" @change="hauteur = $event.target.value">
						<span class="valeur">{{ hauteur }}</span>
					</div>
					<label>{{ $t('voix') }}</label>
					<div class="voix">
						<select @change="voix = $event.target.value">
							<option :selected="voix === ''" value="">--</option>
							<template v-for="(item, index) in listeVoix">
								<option :selected="voix === item.name" :value="item.name" v-if="item.default" :key="index">{{ item.name }} ({{ item.lang }}) -- {{ $t('parDefaut') }}</option>
								<option :selected="voix === item.name" :value="item.name" v-else :key="index">{{ item.name }} ({{ item.lang }})</option>
							</template>
						</select>
					</div>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="parler">{{ $t('ecouter') }}</span>
						<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
					</div>
				</div>
				<span class="bouton audio" role="button" tabindex="0" @click="parler" v-else><i class="material-icons">play_arrow</i></span>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PSynthese',
	components: {
		VueDragResize
	},
	props: {
		panneau: Object,
		largeurPage: Number,
		hauteurPage: Number,
		finRedimensionnement: Boolean,
		zIndex: Number,
		export: Boolean,
		listeVoix: Array
	},
	extends: Panneau,
	data () {
		return {
			chargement: true,
			mode: 'edition',
			deplacement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 20,
			minh: 14,
			statut: '',
			dimensions: {},
			donnees: { x: 0, y: 0 },
			texte: '',
			vitesse: 1,
			hauteur: 1,
			voix: ''
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { texte: this.texte, vitesse: this.vitesse, hauteur: this.hauteur, voix: this.voix }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('syntheseVocale')
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
			this.texte = this.panneau.contenu.texte
			this.vitesse = this.panneau.contenu.vitesse
			this.hauteur = this.panneau.contenu.hauteur
			this.voix = this.panneau.contenu.voix
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' input').focus()
			}.bind(this))
		}
	},
	methods: {
		generer () {
			if (this.texte !== '' && this.voix !== '') {
				this.mode = 'lecture'
				this.w = 20
				this.h = 14
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.positionner()
			}
		},
		editer () {
			this.mode = 'edition'
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 40
			this.h = 41
			this.positionner()
		},
		parler () {
			if (window.speechSynthesis.speaking || this.voix === '') {
				return false
			} else {
				const synthese = new SpeechSynthesisUtterance(this.texte)
				synthese.rate = this.vitesse
				synthese.pitch = this.hauteur
				this.listeVoix.forEach(function (item) {
					if (item.name === this.voix) {
						synthese.voice = item
					}
				}.bind(this))
				window.speechSynthesis.speak(synthese)
			}
		}
	}
}
</script>

<style>
.panneau .conteneur .synthese,
.panneau .conteneur .vitesse,
.panneau .conteneur .hauteur {
	margin-bottom: 2rem;
}

.panneau .conteneur .hauteur .valeur,
.panneau .conteneur .vitesse .valeur {
	width: 3rem;
}

.panneau .conteneur .vitesse,
.panneau .conteneur .hauteur,
.panneau .conteneur .temps .minutes-secondes {
    display: flex;
}

.panneau .conteneur .bouton.audio {
	height: 6.4rem;
	line-height: 6.4rem;
	padding: 0 3rem;
	margin-top: 0;
}

.panneau .conteneur .bouton.audio i {
	font-size: 4.8rem;
}
</style>
