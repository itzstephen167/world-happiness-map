# Roadmap

Small, self-contained improvements, done one at a time.

- [x] 1. README: add a screenshot and the live link
- [x] 2. Dark mode (follows the system setting)
- [x] 3. Replace the approximate scores with the official World Happiness Report data
- [x] 4. Colour-blind-friendly palette toggle
- [x] 5. Show the regional average in the country detail card
- [x] 6. Compare two countries side by side
- [ ] 7. "Biggest movers" list (needs more than one year of data)
- [ ] 8. Year slider (needs more than one year of data)

## Pages and interactive features

Keep the current look. Keep the "Approximate" label on the scores until item 3 is done.

- [x] 9. Multi-page structure: move compare, rankings and about to `compare.html`, `rankings.html` and `about.html`, with the side rail linking between pages
- [x] 10. Full rankings: a sortable, searchable table of every country with a region filter
- [x] 11. Country pages: `country.html?c=Finland` with score, rank, regional average and the countries ranked either side, linked from the map
- [x] 12. Regions page: `regions.html` with a chart of regional averages; click a region to see its countries
- [x] 13. Map filters: highlight a region or a score range on the map
- [x] 14. Shareable links: store the selected country or comparison in the URL
- [x] 15. Game page: "Which country scores higher?" using the dataset, with a running score

## Polish and extras

None of these need outside data. Keep the "Approximate" label on the scores until item 3 is done.

- [x] 16. Keyboard navigation on the map: arrow keys move between countries, Enter opens the country page
- [x] 17. Export the rankings table (with the current filter and sort) as CSV
- [ ] 18. Open Graph / Twitter meta tags so shared links preview nicely
- [ ] 19. Print styles: map, tables and country pages print cleanly, with the side rail hidden
- [ ] 20. Custom 404 page with links back to each page
- [ ] 21. Score distribution chart on the rankings page: a histogram of all countries, with the selected country marked
- [ ] 22. "Random country" button in the side rail
- [ ] 23. Game: add a "guess the score" round and remember the best streak between visits
- [ ] 24. Accessibility: data-table fallback for the map and charts, check focus order and contrast
