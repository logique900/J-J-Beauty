const fs = require('fs');
let code = fs.readFileSync('src/components/FilterSidebar.tsx', 'utf8');

code = code.replace(
  `              {(allBrands.length > 0 ? allBrands : mockBrands).map(brand => (
                <label key={brand.id} className="flex items-center group cursor-pointer">
                  <div className={\`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors \${
                    filters.brands.includes(brand.name) ? 'bg-black dark:bg-brand-900 text-white' : 'border border-gray-300 dark:border-brand-300 group-hover:border-black dark:group-hover:border-brand-900'
                  }\`}>
                    {filters.brands.includes(brand.name) && <Check className="w-3 h-3 text-white dark:text-brand-50" />}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-brand-700 group-hover:text-black dark:group-hover:text-brand-900 font-medium transition-colors">{brand.name}</span>
                </label>
              ))}`,
  `              {(allBrands.length > 0 ? allBrands : mockBrands).map(brand => (
                <label key={brand.id} className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={filters.brands.includes(brand.name)}
                    onChange={() => handleBrandToggle(brand.name)}
                  />
                  <div className={\`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors \${
                    filters.brands.includes(brand.name) ? 'bg-black dark:bg-brand-900 text-white' : 'border border-gray-300 dark:border-brand-300 group-hover:border-black dark:group-hover:border-brand-900'
                  }\`}>
                    {filters.brands.includes(brand.name) && <Check className="w-3 h-3 text-white dark:text-brand-50" />}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-brand-700 group-hover:text-black dark:group-hover:text-brand-900 font-medium transition-colors">{brand.name}</span>
                </label>
              ))}`
);

code = code.replace(
  `                      {cat.collections?.map((col: any) => (
                        <label key={col.id} className="flex items-center group cursor-pointer">
                           <div className={\`w-4 h-4 rounded flex items-center justify-center mr-3 transition-colors \${
                            filters.collections.includes(col.id) ? 'bg-brand-900 text-brand-50' : 'border border-brand-300 group-hover:border-brand-900'
                          }\`}>
                            {filters.collections.includes(col.id) && <Check className="w-2.5 h-2.5 text-brand-50" />}
                          </div>
                          <span className="text-sm text-brand-800 group-hover:text-brand-950 transition-colors">{col.name}</span>
                        </label>
                      ))}`,
  `                      {cat.collections?.map((col: any) => (
                        <label key={col.id} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={filters.collections.includes(col.id)}
                            onChange={() => handleCollectionToggle(col.id)}
                          />
                           <div className={\`w-4 h-4 rounded flex items-center justify-center mr-3 transition-colors \${
                            filters.collections.includes(col.id) ? 'bg-brand-900 text-brand-50' : 'border border-brand-300 group-hover:border-brand-900'
                          }\`}>
                            {filters.collections.includes(col.id) && <Check className="w-2.5 h-2.5 text-brand-50" />}
                          </div>
                          <span className="text-sm text-brand-800 group-hover:text-brand-950 transition-colors">{col.name}</span>
                        </label>
                      ))}`
);

fs.writeFileSync('src/components/FilterSidebar.tsx', code);
