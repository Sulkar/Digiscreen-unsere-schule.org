export default {
	methods: {
		deplacer (donnees) {
			this.deplacement = true
			if (this.donnees && Object.keys(this.donnees).length > 0) {
				this.donnees.x = donnees.x
				this.donnees.y = donnees.y
			}
		},
		redimensionner (donnees) {
			this.deplacement = false
			let base = 10
			if (document.body.clientWidth < 1367) {
				base = 9
			}
			this.w = donnees.width / base
			this.h = donnees.height / base
			this.x = donnees.left
			this.y = donnees.top
		},
		afficher () {
			if (this.z < this.zIndex) {
				const zIndex = this.zIndex + 1
				this.z = zIndex
				this.$emit('zIndex')
			}
		},
		maximiser () {
			this.statut = 'max'
			if (Object.keys(this.dimensions).length === 0) {
				this.dimensions = { w: this.w, h: this.h, x: this.x, y: this.y, z: this.z, minw: this.minw, minh: this.minh }
			}
			this.afficher()
		},
		minimiser () {
			this.statut = 'min'
			if (Object.keys(this.dimensions).length === 0) {
				this.dimensions = { w: this.w, h: this.h, x: this.x, y: this.y, z: this.z, minw: this.minw, minh: this.minh }
			}
			this.h = 3
			this.minh = 3
		},
		normaliser () {
			if (this.statut === 'max') {
				this.w = this.dimensions.w
				this.h = this.dimensions.h
				this.x = this.dimensions.x
				this.y = this.dimensions.y
				this.z = this.dimensions.z
			} else {
				this.h = this.dimensions.h
				this.minh = this.dimensions.minh
				this.positionner()
			}
			this.dimensions = {}
			this.statut = ''
		},
		positionner () {
			if (this.w > document.body.clientWidth) {
				this.w = document.body.clientWidth
			}
			if (this.h > document.body.clientHeight - this.$convertirRem(7.5)) {
				this.h = document.body.clientHeight - this.$convertirRem(7.5)
			}
			if (this.x > document.body.clientWidth - this.$convertirRem(this.w)) {
				this.x = document.body.clientWidth - this.$convertirRem(this.w)
			}
			if (this.y > document.body.clientHeight - (this.$convertirRem(7.5) + this.$convertirRem(this.h))) {
				this.y = document.body.clientHeight - (this.$convertirRem(7.5) + this.$convertirRem(this.h))
			}
		},
		renommer (module) {
			const titre = prompt(this.$t('nouveauTitre'), module)
			if (titre !== null) {
				this.titre = titre
			}
		},
		envoyer (id) {
			const page = prompt(this.$t('envoyerPage'), this.$parent.page)
			if (page !== null && this.$parent.page !== parseInt(page) && parseInt(page) > 0 && parseInt(page) <= this.$parent.pages.length) {
				this.$parent.exportDonnees = true
				this.$nextTick(function () {
					this.$parent.panneaux.forEach(function (panneau) {
						if (panneau.id === id) {
							panneau.page = parseInt(page)
							this.$parent.panneauxPage.forEach(function (item, index) {
								if (item.id === id) {
									this.$parent.panneauxPage.splice(index, 1)
									this.$parent.exportDonnees = false
								}
							}.bind(this))
						}
					}.bind(this))
				}.bind(this))
			}
		}
	}
}
