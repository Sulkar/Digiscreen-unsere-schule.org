<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="mode === 'lecture' && statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="mode === 'lecture' && statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur panneau-tirage-texte actif">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('texteTirageTexte') }}</label>
					<span class="consigne" v-html="$t('consigneTirageTexte')" />
					<textarea class="tirage" :value="texte" @input="texte = $event.target.value" :placeholder="$t('exempleListe')"></textarea>
					<label>{{ $t('supprimerItemTirage') }}</label>
					<div class="choix">
						<span class="oui">
							<input type="radio" :id="'choix_oui_' + id" :name="'choix_oui_' + id" value="oui" :checked="suppression === 'oui'" @change="suppression = $event.target.value">
							<label :for="'choix_oui_' + id">{{ $t('oui') }}</label>
						</span>
						<span class="non">
							<input type="radio" :id="'choix_non_' + id" :name="'choix_oui_' + id" value="non" :checked="suppression === 'non'" @change="suppression = $event.target.value">
							<label :for="'choix_non_' + id">{{ $t('non') }}</label>
						</span>
					</div>
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<div class="contenu inactif" v-else>
					<div class="tirage" :class="{'tirage-en-cours': tirageEnCours}" v-html="tirage" />
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="tirer" v-if="items.length > 1">{{ $t('tirer') }}</span>
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
	name: 'PTirageTexte',
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
			redimensionnement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 30,
			minh: 15,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			texte: '',
			items: [],
			tirage: '',
			suppression: 'non',
			tirageEnCours: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { texte: this.texte, suppression: this.suppression }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('tirageSortTexte')
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
		if (this.panneau.statut === 'max') {
			this.maximiser()
		} else if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		if (this.panneau.contenu !== '') {
			this.texte = this.panneau.contenu.texte
			this.suppression = this.panneau.contenu.suppression
		}
		if (this.mode === 'lecture' && this.texte !== '') {
			this.redimensionnement = true
			this.creer()
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' textarea').focus()
			}.bind(this))
		}
	},
	methods: {
		generer () {
			const items = this.texte.split(',').map(item => item.trim())
			if (items.length > 1) {
				this.mode = 'lecture'
				this.redimensionnement = true
				if (this.donnees.w > 0 && this.donnees.h > 0) {
					this.w = this.donnees.w
					this.h = this.donnees.h
				} else {
					this.w = 40
					this.h = 30
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.positionner()
				this.creer()
			}
		},
		creer () {
			let items = this.texte.split(',').map(item => item.trim())
			items = items.filter((item) => item !== '')
			items = items.filter((item, i, ar) => ar.indexOf(item) === i)
			items = this.$melanger(items)
			this.items = items
			this.tirage = '✨✨✨'
		},
		tirer () {
			if (this.suppression === 'oui') {
				this.items.forEach(function (item, index) {
					if (item === this.tirage) {
						this.items.splice(index, 1)
					}
				}.bind(this))
			}
			const tirageEnCours = setInterval(function () {
				let tirage = this.items[Math.floor(Math.random() * this.items.length)]
				this.tirage = tirage
				this.tirageEnCours = true
			}.bind(this), 5)
			setTimeout(function () {
				clearInterval(tirageEnCours)
				this.tirageEnCours = false
			}.bind(this), 1500)
		},
		editer () {
			this.mode = 'edition'
			this.redimensionnement = false
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.w = this.w
			this.donnees.h = this.h
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 46
			this.h = 40
			this.positionner()
		}
	}
}
</script>

<style>
.panneau .panneau-tirage-texte textarea.tirage {
	height: 15rem;
	max-height: 15rem;
	margin-bottom: 2rem;
}

.panneau .panneau-tirage-texte .oui {
	margin-right: 2.5rem;
}

.panneau .panneau-tirage-texte .choix label {
	display: inline-block;
    width: auto;
    margin-left: 1rem;
	margin-bottom: 0;
}

.panneau .panneau-tirage-texte div.tirage {
    display: flex;
    justify-content: center;
	flex-wrap: wrap;
	font-size: 5rem;
	font-weight: 400;
	margin-bottom: 2rem;
}

.panneau .panneau-tirage-texte div.tirage.tirage-en-cours {
	opacity: 0.25;
}

.panneau .panneau-tirage-texte div.tirage span {
    font-size: 2rem;
	color: orange;
}
</style>
