export default {
  global: {
    layout: {
      title: 'Epispread',
      subtitle: 'Interactive epidemiological maps and graphs'
    }
  },
  geos: {
    geo1: {
      date: '2008_m01',
      datasets: {
        dataset2: {
          source: {
            name: 'dengue_uf_month'
          }
        }
      }
    }
  },
  charts: {
    chart1: {
      datasets: {
        dataset1: {
          order: 1,
          appearance: {
            shape: 'epi-line'
          },
          source: {
            name: 'dengue_incidence_uf_month',
            location: 'RJ'
          }
        },
        dataset2: {
          order: 2,
          appearance: {
            shape: 'epi-line'
          },
          source: {
            name: 'population_uf_year',
            location: 'RJ'
          }
        }
      }
    }
  }
}
