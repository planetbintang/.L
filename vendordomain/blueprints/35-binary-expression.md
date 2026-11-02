# 35. Ekspresi Biner dan Aljabar Boolean

**SNAPS · PLANETBINTANG | Blueprint 35/51**

## Tujuan

Representasi bit, operator logika, dan evaluasi vektor. Dokumen ini mendefinisikan kontrak yang dapat ditinjau, diuji, dan dikembangkan menjadi otomasi REIC dengan kontrol akses yang eksplisit.

## Komponen dan alur

1. **Input** — data bertipe dari registry atau API terautentikasi; input eksternal dianggap tidak tepercaya.
2. **Normalisasi** — parser memeriksa encoding, tipe, ukuran, versi, dan nilai wajib.
3. **Evaluasi biner** — operasi bit-vector dan Boolean menghasilkan keputusan deterministik.
4. **Kebijakan SNAPS** — memeriksa tenant, izin, risiko, integritas, dan batas sumber daya.
5. **Persetujuan Owner** — perubahan berdampak nyata memerlukan approval eksplisit dan tidak dapat disimpulkan dari formula.
6. **Eksekusi backend** — hanya adapter server-side yang terdaftar boleh melakukan operasi provider.
7. **Audit dan observabilitas** — catat identitas aktor, request, versi policy, hash artefak, hasil, dan alasan penolakan.

## Model ekstensi

- .reic menyimpan kontrak dan ekspresi deklaratif.
- .json menyimpan manifest, schema, dan payload bertipe.
- .js mengimplementasikan parser, validator, controller, dan adapter dalam sandbox.
- .html/.css menampilkan panel, tanpa menyimpan token atau secret.
- .sql mengatur skema data persisten dan migrasi.
- .yaml mendefinisikan CI/CD, test gate, dan deployment.
- .md menyimpan penjelasan, prosedur, serta bukti review.

## Rumus biner tingkat sistem

Setiap baris adalah aturan bit-vector 8-bit. Simbol ∧ AND, ∨ OR, ⊕ XOR, ¬ NOT, ≡ ekuivalen, → implikasi, dan mod 2^8 membatasi hasil ke 8 bit. owner_approved, snaps_policy, riskᵢ, dan integrityᵢ merupakan predicate dari policy engine tepercaya. Hash adalah penanda integritas konseptual; algoritma hash nyata harus ditetapkan oleh implementasi.

```reic-binary
r01: v1 = (((x1 ∧ 0b11111110) ⊕ (y1 ∨ 0b11010010)) + (0b01010110 ∧ z1)) mod 2^8; g1 = (v1 ≡ 0b01111010) ∧ owner_approved ∧ snaps_policy; emit1 = g1 → audit(35,1,hash(v1)); deny1 = ¬owner_approved ∨ risk1 ∨ ¬integrity1
r02: v2 = (((x2 ∧ 0b00000101) ⊕ (y2 ∨ 0b11011101)) + (0b01011001 ∧ z2)) mod 2^8; g2 = (v2 ≡ 0b10000001) ∧ owner_approved ∧ snaps_policy; emit2 = g2 → audit(35,2,hash(v2)); deny2 = ¬owner_approved ∨ risk2 ∨ ¬integrity2
r03: v3 = (((x3 ∧ 0b00001100) ⊕ (y3 ∨ 0b11101000)) + (0b01011100 ∧ z3)) mod 2^8; g3 = (v3 ≡ 0b10111000) ∧ owner_approved ∧ snaps_policy; emit3 = g3 → audit(35,3,hash(v3)); deny3 = ¬owner_approved ∨ risk3 ∨ ¬integrity3
r04: v4 = (((x4 ∧ 0b00010011) ⊕ (y4 ∨ 0b11110011)) + (0b01011111 ∧ z4)) mod 2^8; g4 = (v4 ≡ 0b10111111) ∧ owner_approved ∧ snaps_policy; emit4 = g4 → audit(35,4,hash(v4)); deny4 = ¬owner_approved ∨ risk4 ∨ ¬integrity4
r05: v5 = (((x5 ∧ 0b00011010) ⊕ (y5 ∨ 0b11111110)) + (0b01100010 ∧ z5)) mod 2^8; g5 = (v5 ≡ 0b10000110) ∧ owner_approved ∧ snaps_policy; emit5 = g5 → audit(35,5,hash(v5)); deny5 = ¬owner_approved ∨ risk5 ∨ ¬integrity5
r06: v6 = (((x6 ∧ 0b00100001) ⊕ (y6 ∨ 0b00001001)) + (0b01100101 ∧ z6)) mod 2^8; g6 = (v6 ≡ 0b01001101) ∧ owner_approved ∧ snaps_policy; emit6 = g6 → audit(35,6,hash(v6)); deny6 = ¬owner_approved ∨ risk6 ∨ ¬integrity6
r07: v7 = (((x7 ∧ 0b00101000) ⊕ (y7 ∨ 0b00010100)) + (0b01101000 ∧ z7)) mod 2^8; g7 = (v7 ≡ 0b01010100) ∧ owner_approved ∧ snaps_policy; emit7 = g7 → audit(35,7,hash(v7)); deny7 = ¬owner_approved ∨ risk7 ∨ ¬integrity7
r08: v8 = (((x8 ∧ 0b00101111) ⊕ (y8 ∨ 0b00011111)) + (0b01101011 ∧ z8)) mod 2^8; g8 = (v8 ≡ 0b01011011) ∧ owner_approved ∧ snaps_policy; emit8 = g8 → audit(35,8,hash(v8)); deny8 = ¬owner_approved ∨ risk8 ∨ ¬integrity8
r09: v9 = (((x9 ∧ 0b00110110) ⊕ (y9 ∨ 0b00101010)) + (0b01101110 ∧ z9)) mod 2^8; g9 = (v9 ≡ 0b01110010) ∧ owner_approved ∧ snaps_policy; emit9 = g9 → audit(35,9,hash(v9)); deny9 = ¬owner_approved ∨ risk9 ∨ ¬integrity9
r10: v10 = (((x10 ∧ 0b00111101) ⊕ (y10 ∨ 0b00110101)) + (0b01110001 ∧ z10)) mod 2^8; g10 = (v10 ≡ 0b01111001) ∧ owner_approved ∧ snaps_policy; emit10 = g10 → audit(35,10,hash(v10)); deny10 = ¬owner_approved ∨ risk10 ∨ ¬integrity10
r11: v11 = (((x11 ∧ 0b01000100) ⊕ (y11 ∨ 0b01000000)) + (0b01110100 ∧ z11)) mod 2^8; g11 = (v11 ≡ 0b01110000) ∧ owner_approved ∧ snaps_policy; emit11 = g11 → audit(35,11,hash(v11)); deny11 = ¬owner_approved ∨ risk11 ∨ ¬integrity11
r12: v12 = (((x12 ∧ 0b01001011) ⊕ (y12 ∨ 0b01001011)) + (0b01110111 ∧ z12)) mod 2^8; g12 = (v12 ≡ 0b01110111) ∧ owner_approved ∧ snaps_policy; emit12 = g12 → audit(35,12,hash(v12)); deny12 = ¬owner_approved ∨ risk12 ∨ ¬integrity12
r13: v13 = (((x13 ∧ 0b01010010) ⊕ (y13 ∨ 0b01010110)) + (0b01111010 ∧ z13)) mod 2^8; g13 = (v13 ≡ 0b01111110) ∧ owner_approved ∧ snaps_policy; emit13 = g13 → audit(35,13,hash(v13)); deny13 = ¬owner_approved ∨ risk13 ∨ ¬integrity13
r14: v14 = (((x14 ∧ 0b01011001) ⊕ (y14 ∨ 0b01100001)) + (0b01111101 ∧ z14)) mod 2^8; g14 = (v14 ≡ 0b01000101) ∧ owner_approved ∧ snaps_policy; emit14 = g14 → audit(35,14,hash(v14)); deny14 = ¬owner_approved ∨ risk14 ∨ ¬integrity14
r15: v15 = (((x15 ∧ 0b01100000) ⊕ (y15 ∨ 0b01101100)) + (0b10000000 ∧ z15)) mod 2^8; g15 = (v15 ≡ 0b10001100) ∧ owner_approved ∧ snaps_policy; emit15 = g15 → audit(35,15,hash(v15)); deny15 = ¬owner_approved ∨ risk15 ∨ ¬integrity15
r16: v16 = (((x16 ∧ 0b01100111) ⊕ (y16 ∨ 0b01110111)) + (0b10000011 ∧ z16)) mod 2^8; g16 = (v16 ≡ 0b10010011) ∧ owner_approved ∧ snaps_policy; emit16 = g16 → audit(35,16,hash(v16)); deny16 = ¬owner_approved ∨ risk16 ∨ ¬integrity16
r17: v17 = (((x17 ∧ 0b01101110) ⊕ (y17 ∨ 0b10000010)) + (0b10000110 ∧ z17)) mod 2^8; g17 = (v17 ≡ 0b01101010) ∧ owner_approved ∧ snaps_policy; emit17 = g17 → audit(35,17,hash(v17)); deny17 = ¬owner_approved ∨ risk17 ∨ ¬integrity17
r18: v18 = (((x18 ∧ 0b01110101) ⊕ (y18 ∨ 0b10001101)) + (0b10001001 ∧ z18)) mod 2^8; g18 = (v18 ≡ 0b01110001) ∧ owner_approved ∧ snaps_policy; emit18 = g18 → audit(35,18,hash(v18)); deny18 = ¬owner_approved ∨ risk18 ∨ ¬integrity18
r19: v19 = (((x19 ∧ 0b01111100) ⊕ (y19 ∨ 0b10011000)) + (0b10001100 ∧ z19)) mod 2^8; g19 = (v19 ≡ 0b01101000) ∧ owner_approved ∧ snaps_policy; emit19 = g19 → audit(35,19,hash(v19)); deny19 = ¬owner_approved ∨ risk19 ∨ ¬integrity19
r20: v20 = (((x20 ∧ 0b10000011) ⊕ (y20 ∨ 0b10100011)) + (0b10001111 ∧ z20)) mod 2^8; g20 = (v20 ≡ 0b10101111) ∧ owner_approved ∧ snaps_policy; emit20 = g20 → audit(35,20,hash(v20)); deny20 = ¬owner_approved ∨ risk20 ∨ ¬integrity20
r21: v21 = (((x21 ∧ 0b10001010) ⊕ (y21 ∨ 0b10101110)) + (0b10010010 ∧ z21)) mod 2^8; g21 = (v21 ≡ 0b10110110) ∧ owner_approved ∧ snaps_policy; emit21 = g21 → audit(35,21,hash(v21)); deny21 = ¬owner_approved ∨ risk21 ∨ ¬integrity21
r22: v22 = (((x22 ∧ 0b10010001) ⊕ (y22 ∨ 0b10111001)) + (0b10010101 ∧ z22)) mod 2^8; g22 = (v22 ≡ 0b10111101) ∧ owner_approved ∧ snaps_policy; emit22 = g22 → audit(35,22,hash(v22)); deny22 = ¬owner_approved ∨ risk22 ∨ ¬integrity22
r23: v23 = (((x23 ∧ 0b10011000) ⊕ (y23 ∨ 0b11000100)) + (0b10011000 ∧ z23)) mod 2^8; g23 = (v23 ≡ 0b11000100) ∧ owner_approved ∧ snaps_policy; emit23 = g23 → audit(35,23,hash(v23)); deny23 = ¬owner_approved ∨ risk23 ∨ ¬integrity23
r24: v24 = (((x24 ∧ 0b10011111) ⊕ (y24 ∨ 0b11001111)) + (0b10011011 ∧ z24)) mod 2^8; g24 = (v24 ≡ 0b11001011) ∧ owner_approved ∧ snaps_policy; emit24 = g24 → audit(35,24,hash(v24)); deny24 = ¬owner_approved ∨ risk24 ∨ ¬integrity24
r25: v25 = (((x25 ∧ 0b10100110) ⊕ (y25 ∨ 0b11011010)) + (0b10011110 ∧ z25)) mod 2^8; g25 = (v25 ≡ 0b11100010) ∧ owner_approved ∧ snaps_policy; emit25 = g25 → audit(35,25,hash(v25)); deny25 = ¬owner_approved ∨ risk25 ∨ ¬integrity25
r26: v26 = (((x26 ∧ 0b10101101) ⊕ (y26 ∨ 0b11100101)) + (0b10100001 ∧ z26)) mod 2^8; g26 = (v26 ≡ 0b11101001) ∧ owner_approved ∧ snaps_policy; emit26 = g26 → audit(35,26,hash(v26)); deny26 = ¬owner_approved ∨ risk26 ∨ ¬integrity26
r27: v27 = (((x27 ∧ 0b10110100) ⊕ (y27 ∨ 0b11110000)) + (0b10100100 ∧ z27)) mod 2^8; g27 = (v27 ≡ 0b11100000) ∧ owner_approved ∧ snaps_policy; emit27 = g27 → audit(35,27,hash(v27)); deny27 = ¬owner_approved ∨ risk27 ∨ ¬integrity27
r28: v28 = (((x28 ∧ 0b10111011) ⊕ (y28 ∨ 0b11111011)) + (0b10100111 ∧ z28)) mod 2^8; g28 = (v28 ≡ 0b11100111) ∧ owner_approved ∧ snaps_policy; emit28 = g28 → audit(35,28,hash(v28)); deny28 = ¬owner_approved ∨ risk28 ∨ ¬integrity28
r29: v29 = (((x29 ∧ 0b11000010) ⊕ (y29 ∨ 0b00000110)) + (0b10101010 ∧ z29)) mod 2^8; g29 = (v29 ≡ 0b01101110) ∧ owner_approved ∧ snaps_policy; emit29 = g29 → audit(35,29,hash(v29)); deny29 = ¬owner_approved ∨ risk29 ∨ ¬integrity29
r30: v30 = (((x30 ∧ 0b11001001) ⊕ (y30 ∨ 0b00010001)) + (0b10101101 ∧ z30)) mod 2^8; g30 = (v30 ≡ 0b01110101) ∧ owner_approved ∧ snaps_policy; emit30 = g30 → audit(35,30,hash(v30)); deny30 = ¬owner_approved ∨ risk30 ∨ ¬integrity30
r31: v31 = (((x31 ∧ 0b11010000) ⊕ (y31 ∨ 0b00011100)) + (0b10110000 ∧ z31)) mod 2^8; g31 = (v31 ≡ 0b01111100) ∧ owner_approved ∧ snaps_policy; emit31 = g31 → audit(35,31,hash(v31)); deny31 = ¬owner_approved ∨ risk31 ∨ ¬integrity31
r32: v32 = (((x32 ∧ 0b11010111) ⊕ (y32 ∨ 0b00100111)) + (0b10110011 ∧ z32)) mod 2^8; g32 = (v32 ≡ 0b01000011) ∧ owner_approved ∧ snaps_policy; emit32 = g32 → audit(35,32,hash(v32)); deny32 = ¬owner_approved ∨ risk32 ∨ ¬integrity32
r33: v33 = (((x33 ∧ 0b11011110) ⊕ (y33 ∨ 0b00110010)) + (0b10110110 ∧ z33)) mod 2^8; g33 = (v33 ≡ 0b01011010) ∧ owner_approved ∧ snaps_policy; emit33 = g33 → audit(35,33,hash(v33)); deny33 = ¬owner_approved ∨ risk33 ∨ ¬integrity33
r34: v34 = (((x34 ∧ 0b11100101) ⊕ (y34 ∨ 0b00111101)) + (0b10111001 ∧ z34)) mod 2^8; g34 = (v34 ≡ 0b01100001) ∧ owner_approved ∧ snaps_policy; emit34 = g34 → audit(35,34,hash(v34)); deny34 = ¬owner_approved ∨ risk34 ∨ ¬integrity34
r35: v35 = (((x35 ∧ 0b11101100) ⊕ (y35 ∨ 0b01001000)) + (0b10111100 ∧ z35)) mod 2^8; g35 = (v35 ≡ 0b00011000) ∧ owner_approved ∧ snaps_policy; emit35 = g35 → audit(35,35,hash(v35)); deny35 = ¬owner_approved ∨ risk35 ∨ ¬integrity35
r36: v36 = (((x36 ∧ 0b11110011) ⊕ (y36 ∨ 0b01010011)) + (0b10111111 ∧ z36)) mod 2^8; g36 = (v36 ≡ 0b00011111) ∧ owner_approved ∧ snaps_policy; emit36 = g36 → audit(35,36,hash(v36)); deny36 = ¬owner_approved ∨ risk36 ∨ ¬integrity36
r37: v37 = (((x37 ∧ 0b11111010) ⊕ (y37 ∨ 0b01011110)) + (0b11000010 ∧ z37)) mod 2^8; g37 = (v37 ≡ 0b01100110) ∧ owner_approved ∧ snaps_policy; emit37 = g37 → audit(35,37,hash(v37)); deny37 = ¬owner_approved ∨ risk37 ∨ ¬integrity37
r38: v38 = (((x38 ∧ 0b00000001) ⊕ (y38 ∨ 0b01101001)) + (0b11000101 ∧ z38)) mod 2^8; g38 = (v38 ≡ 0b10101101) ∧ owner_approved ∧ snaps_policy; emit38 = g38 → audit(35,38,hash(v38)); deny38 = ¬owner_approved ∨ risk38 ∨ ¬integrity38
r39: v39 = (((x39 ∧ 0b00001000) ⊕ (y39 ∨ 0b01110100)) + (0b11001000 ∧ z39)) mod 2^8; g39 = (v39 ≡ 0b10110100) ∧ owner_approved ∧ snaps_policy; emit39 = g39 → audit(35,39,hash(v39)); deny39 = ¬owner_approved ∨ risk39 ∨ ¬integrity39
r40: v40 = (((x40 ∧ 0b00001111) ⊕ (y40 ∨ 0b01111111)) + (0b11001011 ∧ z40)) mod 2^8; g40 = (v40 ≡ 0b10111011) ∧ owner_approved ∧ snaps_policy; emit40 = g40 → audit(35,40,hash(v40)); deny40 = ¬owner_approved ∨ risk40 ∨ ¬integrity40
r41: v41 = (((x41 ∧ 0b00010110) ⊕ (y41 ∨ 0b10001010)) + (0b11001110 ∧ z41)) mod 2^8; g41 = (v41 ≡ 0b01010010) ∧ owner_approved ∧ snaps_policy; emit41 = g41 → audit(35,41,hash(v41)); deny41 = ¬owner_approved ∨ risk41 ∨ ¬integrity41
r42: v42 = (((x42 ∧ 0b00011101) ⊕ (y42 ∨ 0b10010101)) + (0b11010001 ∧ z42)) mod 2^8; g42 = (v42 ≡ 0b01011001) ∧ owner_approved ∧ snaps_policy; emit42 = g42 → audit(35,42,hash(v42)); deny42 = ¬owner_approved ∨ risk42 ∨ ¬integrity42
r43: v43 = (((x43 ∧ 0b00100100) ⊕ (y43 ∨ 0b10100000)) + (0b11010100 ∧ z43)) mod 2^8; g43 = (v43 ≡ 0b01010000) ∧ owner_approved ∧ snaps_policy; emit43 = g43 → audit(35,43,hash(v43)); deny43 = ¬owner_approved ∨ risk43 ∨ ¬integrity43
r44: v44 = (((x44 ∧ 0b00101011) ⊕ (y44 ∨ 0b10101011)) + (0b11010111 ∧ z44)) mod 2^8; g44 = (v44 ≡ 0b01010111) ∧ owner_approved ∧ snaps_policy; emit44 = g44 → audit(35,44,hash(v44)); deny44 = ¬owner_approved ∨ risk44 ∨ ¬integrity44
r45: v45 = (((x45 ∧ 0b00110010) ⊕ (y45 ∨ 0b10110110)) + (0b11011010 ∧ z45)) mod 2^8; g45 = (v45 ≡ 0b01011110) ∧ owner_approved ∧ snaps_policy; emit45 = g45 → audit(35,45,hash(v45)); deny45 = ¬owner_approved ∨ risk45 ∨ ¬integrity45
r46: v46 = (((x46 ∧ 0b00111001) ⊕ (y46 ∨ 0b11000001)) + (0b11011101 ∧ z46)) mod 2^8; g46 = (v46 ≡ 0b00100101) ∧ owner_approved ∧ snaps_policy; emit46 = g46 → audit(35,46,hash(v46)); deny46 = ¬owner_approved ∨ risk46 ∨ ¬integrity46
r47: v47 = (((x47 ∧ 0b01000000) ⊕ (y47 ∨ 0b11001100)) + (0b11100000 ∧ z47)) mod 2^8; g47 = (v47 ≡ 0b01101100) ∧ owner_approved ∧ snaps_policy; emit47 = g47 → audit(35,47,hash(v47)); deny47 = ¬owner_approved ∨ risk47 ∨ ¬integrity47
r48: v48 = (((x48 ∧ 0b01000111) ⊕ (y48 ∨ 0b11010111)) + (0b11100011 ∧ z48)) mod 2^8; g48 = (v48 ≡ 0b01110011) ∧ owner_approved ∧ snaps_policy; emit48 = g48 → audit(35,48,hash(v48)); deny48 = ¬owner_approved ∨ risk48 ∨ ¬integrity48
r49: v49 = (((x49 ∧ 0b01001110) ⊕ (y49 ∨ 0b11100010)) + (0b11100110 ∧ z49)) mod 2^8; g49 = (v49 ≡ 0b01001010) ∧ owner_approved ∧ snaps_policy; emit49 = g49 → audit(35,49,hash(v49)); deny49 = ¬owner_approved ∨ risk49 ∨ ¬integrity49
r50: v50 = (((x50 ∧ 0b01010101) ⊕ (y50 ∨ 0b11101101)) + (0b11101001 ∧ z50)) mod 2^8; g50 = (v50 ≡ 0b01010001) ∧ owner_approved ∧ snaps_policy; emit50 = g50 → audit(35,50,hash(v50)); deny50 = ¬owner_approved ∨ risk50 ∨ ¬integrity50
r51: v51 = (((x51 ∧ 0b01011100) ⊕ (y51 ∨ 0b11111000)) + (0b11101100 ∧ z51)) mod 2^8; g51 = (v51 ≡ 0b01001000) ∧ owner_approved ∧ snaps_policy; emit51 = g51 → audit(35,51,hash(v51)); deny51 = ¬owner_approved ∨ risk51 ∨ ¬integrity51
```

## Invarian keamanan

- Default adalah DENY jika identitas, izin, integritas, policy, atau status approval tidak tersedia.
- Formula tidak boleh mengubah role, owner, secret, atau policy sumbernya sendiri.
- Tidak ada akses provider dari browser; secret hanya berada pada secret manager/backend.
- Operasi bersifat idempotent, memiliki batas waktu, retry terbatas, dan prosedur kompensasi/rollback.
- Data tenant selalu di-scope oleh identitas tenant yang diverifikasi server.
- Audit perubahan bersifat append-only dan tidak boleh memuat secret mentah.

## Status implementasi

**SPECIFICATION-ONLY.** Dokumen dan kontrak ini belum mengaktifkan operasi cloud. Implementasi memerlukan parser REIC yang terversi, schema validator, sandbox runtime, adapter provider, autentikasi sesi, RBAC tenant, database persisten, pengujian unit/integrasi, dan persetujuan Owner. Jangan menandai fitur LIVE sebelum tes sandbox serta smoke test produksi lulus.

## Metadata kendali

- Owner authority: OWNER
- Platform identity: PLANETBINTANG
- Policy authority: SNAPS
- Blueprint ID: PB-REIC-035
- Contract: 35-binary-expression.reic
- Formula rows: 51
