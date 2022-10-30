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
			<div class="conteneur actif panneau-groupes">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('listePersonnes') }}</label>
					<span class="consigne" v-html="$t('consigneGroupe')" />
					<textarea class="groupes" :value="texte" @input="texte = $event.target.value" :placeholder="$t('exempleGroupe')"></textarea>
					<label>{{ $t('nombrePersonnesGroupe') }}</label>
					<input type="number" :value="personnes" :min="1" @input="personnes = $event.target.value">
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<div class="contenu inactif" v-else>
					<div class="groupes">
						<div class="groupe" v-for="(groupe, index) in groupes" :key="'groupe_' + index">
							<div>Groupe {{ index + 1 }}</div>
							<ul>
								<li v-for="(personne, indexPersonne) in groupe" :key="personne + '_' + indexPersonne">{{ personne }}</li>
							</ul>
						</div>
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
	name: 'PGroupes',
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
			minw: 32,
			minh: 28,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			texte: '',
			personnes: 1,
			groupes: []
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { texte: this.texte, personnes: this.personnes, groupes: this.groupes }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('groupes')
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
			this.personnes = this.panneau.contenu.personnes
			this.groupes = this.panneau.contenu.groupes
		}
		if (this.mode === 'lecture') {
			this.redimensionnement = true
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
			if (this.texte !== '') {
				this.mode = 'lecture'
				this.redimensionnement = true
				let liste = this.texte.split(',').map(item => item.trim())
				liste = liste.filter(item => item !== '')
				liste = this.$melanger(liste)
				const nombrePersonnes = parseInt(this.personnes)
				if (liste.length > 0 && nombrePersonnes > 0) {
					let nombreGroupes = Math.ceil(liste.length / nombrePersonnes)
					let indexPersonne = 0
					while (nombreGroupes > 0) {
						const groupe = []
						let i
						if (nombreGroupes < 1) {
							while (indexPersonne < liste.length) {
								groupe[groupe.length] = liste[indexPersonne]
								indexPersonne++
							}
						} else {
							for (i = nombrePersonnes; i > 0 ; i--) {
								groupe[groupe.length] = liste[indexPersonne]
								indexPersonne++
							}
						}
						this.groupes[this.groupes.length] = groupe
						nombreGroupes--
					}
				}
				if (this.donnees.w > 0 && this.donnees.h > 0) {
					this.w = this.donnees.w
					this.h = this.donnees.h
				} else {
					this.w = 64
					this.h = 48
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.positionner()
			}
		},
		editer () {
			this.mode = 'edition'
			this.redimensionnement = false
			this.groupes = []
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.w = this.w
			this.donnees.h = this.h
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 46
			this.h = 42
			this.positionner()
		}
	}
}
</script>

<style>
.panneau .conteneur textarea.groupes {
	height: 15rem;
	max-height: 15rem;
	margin-bottom: 2rem;
}

.panneau .conteneur div.groupes {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
}

.panneau .conteneur .groupe {
    border: 1px solid #ddd;
    width: 28rem;
    padding: 1.5rem 1rem;
    margin: 1rem;
    font-size: 2.4rem;
}

.panneau .conteneur .groupe div {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #ddd;
    margin-bottom: 1.5rem;
    font-weight: 700;
}

.panneau .conteneur .groupe ul {
    list-style: none;
}

.panneau .conteneur .groupe li {
    margin-bottom: 1rem;
    line-height: 1.4;
}

.panneau .conteneur .groupe li:last-child {
    margin-bottom: 0;
}
</style>
