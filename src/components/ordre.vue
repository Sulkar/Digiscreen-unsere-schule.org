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
			<div class="conteneur actif panneau-ordre">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('typeRemiseOrdre') }}</label>
					<div class="choix">
						<span class="horizontale">
							<input type="radio" :id="'horizontale_' + id" :name="'horizontale_' + id" value="horizontale" :checked="type === 'horizontale'" @change="type = $event.target.value">
							<label :for="'horizontale_' + id">{{ $t('horizontale') }}</label>
						</span>
						<span class="verticale">
							<input type="radio" :id="'verticale_' + id" :name="'horizontale_' + id" value="verticale" :checked="type === 'verticale'" @change="type = $event.target.value">
							<label :for="'verticale_' + id">{{ $t('verticale') }}</label>
						</span>
					</div>
					<label>{{ $t('itemsOrdre') }}</label>
					<div class="items">
						<input type="search" v-for="(item, index) in items" :value="item" @input="items[index] = $event.target.value" :key="'item_' + index">
					</div>
					<span class="bouton-secondaire" role="button" tabindex="0" :title="$t('ajouterItem')" @click="ajouterItem"><i class="material-icons">add_circle_outline</i></span>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
					</div>
				</div>
				<div class="contenu inactif" v-else>
					<div class="items" :class="{'horizontale': type === 'horizontale', 'verticale': type === 'verticale'}">
						<div class="item" v-for="(item, index) in itemsMelanges" :class="{'correct': resultat === 'correct'}" :key="'item_' + index">
							<span>{{ item }}</span>
						</div>
					</div>
					<div v-if="resultat === 'correct'">
						<span class="emoticones">🎉🥳</span>
						<span class="bouton correct">{{ $t('bravoExercice') }}</span>
						<span class="emoticones">🥳🎉</span>
					</div>
					<div v-else-if="resultat === 'incorrect'">
						<span class="emoticones">🙁🙁</span>
						<span class="bouton verifier" @click="verifier">{{ $t('verifier') }}</span>
						<span class="emoticones">🙁🙁</span>
					</div>
					<span class="bouton verifier" role="button" tabindex="0" v-else @click="verifier">{{ $t('verifier') }}</span>
				</div>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Sortable from 'sortablejs'
import Panneau from '@/panneau'

export default {
	name: 'POrdre',
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
			type: 'horizontale',
			items: ['', '', '', '', ''],
			itemsMelanges: [],
			resultat: '',
			sortable: ''
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { items: this.items, type: this.type }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('remiseOrdre')
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
			this.items = this.panneau.contenu.items
			this.type = this.panneau.contenu.type
			this.itemsMelanges = this.$melanger(JSON.parse(JSON.stringify(this.items)))
		}
		if (this.mode === 'lecture') {
			this.redimensionnement = true
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'lecture') {
			this.$nextTick(function () {
				this.sortable = new Sortable(document.querySelector('#' + this.id + ' .conteneur .items'), {
					sort: true,
					delay: 0,
					delayOnTouchOnly: false,
					touchStartThreshold: 0,
					animation: 150,
					easing: 'cubic-bezier(1, 0, 0, 1)',
					draggable: '.item',
					filter: '.item.correct',
					preventOnFilter: true
				})
			}.bind(this))
		}
	},
	methods: {
		generer () {
			if (this.items.length > 0) {
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
				this.items.forEach(function (item, index) {
					this.items[index] = item.trim()
				}.bind(this))
				this.items = this.items.filter(function (element) {
					return element !== ''
				})
				this.itemsMelanges = this.$melanger(JSON.parse(JSON.stringify(this.items)))
				this.$nextTick(function () {
					this.sortable = new Sortable(document.querySelector('#' + this.id + ' .conteneur .items'), {
						sort: true,
						delay: 0,
						delayOnTouchOnly: false,
						touchStartThreshold: 0,
						animation: 150,
						easing: 'cubic-bezier(1, 0, 0, 1)',
						draggable: '.item',
						filter: '.item.correct',
						preventOnFilter: true
					})
				}.bind(this))
			}
		},
		editer () {
			this.sortable.destroy()
			this.$nextTick(function () {
				this.mode = 'edition'
				this.redimensionnement = false
				this.itemsMelanges = []
				this.resultat = ''
				this.sortable = ''
				if (this.statut !== '') {
					this.normaliser()
				}
				this.donnees.w = this.w
				this.donnees.h = this.h
				this.donnees.x = this.x
				this.donnees.y = this.y
				this.w = 46
				this.h = 50.4
				this.positionner()
			}.bind(this))
		},
		verifier () {
			const reponse = []
			var elements = document.querySelectorAll('#' + this.id + ' .items .item')
			elements.forEach(function (element) {
				reponse.push(element.textContent)
			})
			if (this.items.toString() === reponse.toString()) {
				this.resultat = 'correct'
				this.$lancerConfettis()
			} else {
				this.resultat = 'incorrect'
			}
		},
		ajouterItem () {
			this.items.push('')
		}
	}
}
</script>

<style>
.panneau .conteneur.panneau-ordre .choix {
	margin-bottom: 2rem;
}

.panneau .conteneur .horizontale {
	margin-right: 2.5rem;
}

.panneau .conteneur .items .item {
    padding: 0.5rem 1.5rem;
    border: 1px solid #ddd;
    border-radius: 0.4rem;
	font-size: 3.2rem;
	font-weight: 400;
	line-height: 1.4;
	cursor: move;
	background: #fff;
}

.panneau .conteneur .items .item.correct {
    color: #00b894;
    border: 1px solid #00b894;
	cursor: default;
}

.panneau .conteneur .items.horizontale .item {
	display: inline-block;
	margin: 0.5rem;
}

.panneau .conteneur .items.verticale .item {
	display: block;
	margin: 1rem 0;
}
</style>
