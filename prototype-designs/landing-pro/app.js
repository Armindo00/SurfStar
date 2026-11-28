(() => {
  const nav = document.getElementById('nav')
  const burger = document.getElementById('burger')
  const mobileNav = document.getElementById('mobileNav')
  const modal = document.getElementById('modal')
  const lightbox = document.getElementById('lightbox')
  const lightboxImg = document.getElementById('lightboxImg')
  const lightboxCaption = document.getElementById('lightboxCaption')
  const planNote = document.getElementById('planNote')
  const modalEyebrow = document.getElementById('modalEyebrow')
  const modalTitle = document.getElementById('modalTitle')
  const modalBody = document.getElementById('modalBody')

  const copy = {
    signup: {
      eyebrow: 'Treinador',
      title: 'Criar conta de treinador',
      body: 'Neste protótipo o onboarding está simulado. Na app real, este botão abre a escolha de plano e o registo SurfStar.',
    },
    signin: {
      eyebrow: 'Entrar',
      title: 'Entrar na SurfStar',
      body: 'Fluxo simulado. Na app real escolhes treinador ou atleta e entras na tua conta.',
    },
    athlete: {
      eyebrow: 'Atleta',
      title: 'Entrar como atleta',
      body: 'Os atletas entram gratuitamente. Neste protótipo o login está simulado.',
    },
  }

  function setScrolled() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8)
  }

  function closeMobile() {
    mobileNav.hidden = true
    burger.setAttribute('aria-expanded', 'false')
  }

  burger?.addEventListener('click', () => {
    const open = mobileNav.hidden
    mobileNav.hidden = !open
    burger.setAttribute('aria-expanded', String(open))
  })

  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobile)
  })

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-open')
      const payload = copy[key] || copy.signup
      modalEyebrow.textContent = payload.eyebrow
      modalTitle.textContent = payload.title
      modalBody.textContent = payload.body
      closeMobile()
      modal.showModal()
    })
  })

  document.querySelectorAll('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', () => {
      lightboxImg.src = btn.getAttribute('data-lightbox')
      lightboxImg.alt = btn.getAttribute('data-caption') || ''
      lightboxCaption.textContent = btn.getAttribute('data-caption') || ''
      lightbox.showModal()
    })
  })

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close()
  })
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) modal.close()
  })

  let interval = 'monthly'
  function formatPrice(value) {
    const rounded = Math.round(value * 100) / 100
    return Number.isInteger(rounded) ? `€${rounded}` : `€${rounded.toFixed(2).replace('.', ',')}`
  }

  function applyInterval() {
    document.querySelectorAll('[data-price-monthly]').forEach((el) => {
      const monthly = Number(el.getAttribute('data-price-monthly'))
      const annual = Number(el.getAttribute('data-price-annual'))
      el.textContent = formatPrice(interval === 'annual' ? annual : monthly)
    })
    document.querySelectorAll('[data-suffix]').forEach((el) => {
      el.textContent = interval === 'annual' ? '/ mês · faturação anual' : '/ mês'
    })
  }

  document.querySelectorAll('[data-interval]').forEach((btn) => {
    btn.addEventListener('click', () => {
      interval = btn.getAttribute('data-interval')
      document.querySelectorAll('[data-interval]').forEach((other) => {
        const active = other === btn
        other.classList.toggle('is-active', active)
        other.setAttribute('aria-selected', String(active))
      })
      applyInterval()
    })
  })

  document.querySelectorAll('[data-select-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-select-plan')
      document.querySelectorAll('.plan').forEach((card) => card.classList.remove('is-selected'))
      btn.closest('.plan')?.classList.add('is-selected')
      planNote.textContent =
        interval === 'annual'
          ? `Selecionaste ${plan} (anual). Na app real seguiria para checkout.`
          : `Selecionaste ${plan} (mensal). Na app real seguiria para checkout.`
    })
  })

  const sectionIds = ['produto', 'epoca', 'precos', 'faq']
  const sectionLinks = [...document.querySelectorAll('.nav__links a')]

  function updateActiveSection() {
    let current = null
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (!el) continue
      const top = el.getBoundingClientRect().top
      if (top <= 120) current = id
    }
    sectionLinks.forEach((link) => {
      const href = link.getAttribute('href')?.slice(1)
      link.classList.toggle('is-active', href === current)
    })
  }

  const revealEls = document.querySelectorAll('.reveal')
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    revealEls.forEach((el) => io.observe(el))
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'))
  }

  window.addEventListener('scroll', () => {
    setScrolled()
    updateActiveSection()
  }, { passive: true })

  setScrolled()
  updateActiveSection()
  applyInterval()
})()
