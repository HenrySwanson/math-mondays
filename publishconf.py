#!/usr/bin/env python
# -*- coding: utf-8 -*- #

# This file is only used if you use `make publish` or
# explicitly specify it as your config file.

import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *

# Generate absolute URLs across the site
RELATIVE_URLS = False

# Clear the output directory so that we don't get leftovers
DELETE_OUTPUT_DIRECTORY = True

# Set a few other production things
JINJA_GLOBALS["production"] = True