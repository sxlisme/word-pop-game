# Third-party data

The built-in word list is generated from [ECDICT](https://github.com/skywind3000/ECDICT),
Copyright (c) 2015-2025 Yuchen Xie, distributed under the MIT License.

The source data is filtered to entries tagged `zk` (middle-school entrance examination)
and `gk` (college entrance examination). The build script consumes compact generated lists
from [aubergines-words](https://github.com/reinhardliu-cloud/aubergines-words), which documents
those lists as ECDICT exam-tag exports. The primary-school group is the highest-frequency
subset of the `zk` vocabulary, while the remaining groups preserve the examination tags.
