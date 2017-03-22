.PHONY : all test test-default test-travis jshint eslint jscs mocha mocha-ts istanbul npm-freeze david dist literate README.md

BINDIR=node_modules/.bin

JSHINT=$(BINDIR)/jshint
ESLINT=$(BINDIR)/eslint
JSCS=$(BINDIR)/jscs
MOCHA=$(BINDIR)/mocha
IMOCHA=$(BINDIR)/_mocha
ISTANBUL=$(BINDIR)/istanbul
BROWSERIFY=$(BINDIR)/browserify
LJS=$(BINDIR)/ljs
DAVID=$(BINDIR)/david
NPMFREEZE=$(BINDIR)/npm-freeze

DIST=dist/optika.standalone.js

all : test

test :
	if [ "x${TRAVIS}" = "xtrue" ]; then $(MAKE) test-travis; else $(MAKE) test-default; fi

test-default : jshint eslint jscs mocha istanbul mocha-ts david npm-freeze

test-travis : test-readme test-default

SRC=lib test

jshint :
	$(JSHINT) $(SRC)

eslint :
	$(ESLINT) $(SRC)

jscs :
	$(JSCS) $(SRC)

mocha :
	$(MOCHA) --reporter spec test

mocha-ts :
	@echo TODO
	# $(MOCHA) --reporter spec --require ts-node/register `find test-ts -name '*.ts'`

istanbul :
	$(ISTANBUL) cover -- $(IMOCHA) --reporter dot --timeout 10000 test
	test -f coverage/coverage.json
	$(ISTANBUL) check-coverage --statements 100 --branches -4 --functions 100 coverage/coverage.json

dist : test literate $(DIST)
	git clean -fdx -e node_modules

david :
	$(DAVID)

npm-freeze :
	$(NPMFREEZE) check || true

npm-freeze-manifest : npm-freeze-manifest.json

npm-freeze-manifest.json :
	$(NPMFREEZE) manifest

$(DIST) : lib/*
	$(BROWSERIFY) --no-detect-globals -s optika -o $(DIST) ./lib/optika.js

literate : README.md

README.md :
	$(LJS) --no-code -o README.md lib/optika.js

test-readme : literate
	git diff --exit-code || (echo "README.md is generated file, run 'make README.md'" && false)

MPOST=mpost
SVGPARAMS=-s outputformat='"svg"' -s outputtemplate='"%j.svg"'

optika.svg : optika.mp
	$(MPOST) $(SVGPARAMS) $<

optika-300.png : optika.svg
	inkscape --export-png=optika-300.png --export-dpi=300 --export-background-opacity=0 --without-gui optika.svg
